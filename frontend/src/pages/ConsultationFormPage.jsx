import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAppointment } from "../api/appointments";
import { getConsultation, recordConsultation, updateConsultation } from "../api/consultations";
import { tomorrowString, todayString } from "../lib/dates";
import { friendlyMessage } from "../lib/errors";
import { ArrowLeft, ClipboardPlus, FileText, HeartPulse, Plus, Save, Trash2 } from "lucide-react";

const MAX_ITEMS = 20; // Swagger: maxItems 20

// Rows need a stable key so removing a middle row doesn't shuffle the inputs
let nextKey = 0;
const newItem = (item = {}) => ({
  key: ++nextKey,
  medicine_name: item.medicine_name ?? "",
  dosage: item.dosage ?? "",
  frequency: item.frequency ?? "",
  duration_days: item.duration_days != null ? String(item.duration_days) : "",
  instructions: item.instructions ?? "",
});

// Form rows → API shape (Swagger's PrescriptionInput)
function toPayloadItems(items) {
  return items.map((it) => ({
    medicine_name: it.medicine_name.trim(),
    dosage: it.dosage.trim(),
    frequency: it.frequency.trim(),
    duration_days: it.duration_days === "" ? undefined : Number(it.duration_days), // JSON omits undefined
    ...(it.instructions.trim() && { instructions: it.instructions.trim() }),
  }));
}

const EMPTY = { symptoms: "", diagnosis: "", notes: "", follow_up_date: "" };
const inputClass = "patient-form-input";

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-600 text-sm mt-1">{error[0]}</p>}
    </div>
  );
}

export default function ConsultationFormPage() {
  const { appointmentId, id } = useParams(); // create has appointmentId, edit has id
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [context, setContext] = useState(null); // { patientName, date, time, reason }
  const [form, setForm] = useState(EMPTY);
  const [items, setItems] = useState([]);
  const [initial, setInitial] = useState({ form: EMPTY, itemsJson: "[]" }); // for diffing on edit

  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(""); // a reason the form can't be used at all
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        if (isEdit) {
          const c = await getConsultation(id);
          if (ignore) return;
          const values = {
            symptoms: c.symptoms ?? "",
            diagnosis: c.diagnosis,
            notes: c.notes ?? "",
            follow_up_date: c.follow_up_date ?? "",
          };
          const rows = c.prescriptions.map(newItem);
          setForm(values);
          setItems(rows);
          setInitial({ form: values, itemsJson: JSON.stringify(toPayloadItems(rows)) });
          setContext({ patientName: c.patient.full_name, date: c.appointment.date, time: c.appointment.start_time });
        } else {
          const a = await getAppointment(appointmentId);
          if (ignore) return;
          setContext({ patientName: a.patient.full_name, date: a.appointment_date, time: a.start_time, reason: a.reason });

          // The API would answer 409 for these. Explaining up front is friendlier.
          if (a.status !== "confirmed") setBlocked(`This appointment is ${a.status}. Only confirmed appointments can have a consultation.`);
          else if (a.appointment_date > todayString()) setBlocked("This appointment has not happened yet.");
        }
      } catch (err) {
        if (!ignore) setBlocked(friendlyMessage(err)); // 403 (not yours), 404
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id, appointmentId, isEdit]);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));
  const setItem = (key, name) => (e) =>
    setItems((list) => list.map((it) => (it.key === key ? { ...it, [name]: e.target.value } : it)));
  const addItem = () => setItems((list) => (list.length < MAX_ITEMS ? [...list, newItem()] : list));
  const removeItem = (key) => setItems((list) => list.filter((it) => it.key !== key));

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    let payload;
    if (isEdit) {
      // Swagger: "send only what changed"
      payload = {};
      for (const name of Object.keys(EMPTY)) {
        if (form[name] !== initial.form[name]) payload[name] = form[name].trim();
      }
      const itemsNow = toPayloadItems(items);
      if (JSON.stringify(itemsNow) !== initial.itemsJson) payload.prescriptions = itemsNow;

      if (Object.keys(payload).length === 0) {
        setFormError("No changes to save.");
        return;
      }
    } else {
      payload = {
        diagnosis: form.diagnosis.trim(),
        ...(form.symptoms.trim() && { symptoms: form.symptoms.trim() }),
        ...(form.notes.trim() && { notes: form.notes.trim() }),
        ...(form.follow_up_date && { follow_up_date: form.follow_up_date }),
        prescriptions: toPayloadItems(items),
      };
    }

    setSubmitting(true);
    try {
      const c = isEdit ? await updateConsultation(id, payload) : await recordConsultation(appointmentId, payload);
      navigate(`/consultations/${c.id}`, {
        state: { flash: isEdit ? "Consultation updated" : "Consultation recorded. The appointment is now completed." },
      });
    } catch (err) {
      if (err.status === 422) {
        setFieldErrors(err.errors || {});
        setFormError("Please fix the highlighted fields.");
      } else if (err.status === 403) {
        setFormError(isEdit ? "Only the doctor who recorded this consultation can edit it." : err.message);
      } else {
        setFormError(friendlyMessage(err)); // 409, 429, network
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="dashboard-loading"><span /><p>Loading consultation workspace...</p></div>;

  if (blocked) {
    return (
      <div className="form-state page-enter">
        <div className="patients-error">{blocked}</div>
        <Link to="/appointments" className="back-link"><ArrowLeft size={15} /> Back to appointments</Link>
      </div>
    );
  }

  const err = fieldErrors;

  return (
    <div className="consultation-form-page page-enter">
      <Link to="/appointments" className="back-link"><ArrowLeft size={15} /> Back to appointments</Link>
      <div className="form-page-heading"><div><p className="eyebrow">Clinical record</p><h1>{isEdit ? "Edit consultation" : "Record consultation"}</h1><p className="page-subtitle">Document the visit clearly for the patient&apos;s care history.</p></div><div className="form-security"><ClipboardPlus size={17} /> Doctor workspace</div></div>
      <div className="consultation-context"><HeartPulse size={18} /><span><strong>{context.patientName}</strong> · {context.date} at {context.time}{context.reason && <small>Reason: {context.reason}</small>}</span></div>

      <form onSubmit={handleSubmit} className="consultation-form-card patient-form-card">
        {formError && (
          <div className="patients-error form-error">
            {formError}
            {!isEdit && formError.includes("current status") && <Link to="/appointments" className="block mt-1 underline">Back to appointments</Link>}
          </div>
        )}

        <Field label="Symptoms" error={err.symptoms}>
          <textarea className={inputClass} rows={2} maxLength={2000} value={form.symptoms} onChange={set("symptoms")} />
        </Field>

        <Field label="Diagnosis" required error={err.diagnosis}>
          <textarea className={inputClass} rows={2} maxLength={2000} value={form.diagnosis} onChange={set("diagnosis")} required />
        </Field>

        <Field label="Notes" error={err.notes}>
          <textarea className={inputClass} rows={3} maxLength={5000} value={form.notes} onChange={set("notes")} />
        </Field>

        <Field label="Follow-up date" error={err.follow_up_date}>
          <input type="date" className="patient-form-input date-input" min={tomorrowString()} value={form.follow_up_date} onChange={set("follow_up_date")} />
        </Field>

        {/* Prescriptions: a dynamic list */}
        <div className="consultation-section prescription-section">
          <div className="prescription-heading">
            <div className="form-section-heading"><span className="section-icon"><FileText size={17} /></span><div><h2>Prescription <small>({items.length}/{MAX_ITEMS})</small></h2><p>Add medicines and instructions when needed.</p></div></div>
            <button
              type="button"
              onClick={addItem}
              disabled={items.length >= MAX_ITEMS}
              className="secondary-button add-medicine-button"
            >
              <Plus size={15} /> Add medicine
            </button>
          </div>

          {err.prescriptions && <p className="text-red-600 text-sm mb-2">{err.prescriptions[0]}</p>}
          {items.length === 0 && <p className="no-slots-message">No medicines added. Prescriptions are optional.</p>}

          <div className="space-y-3">
            {items.map((it, i) => {
              // Dotted-key errors from the API, by this row's current position
              const e = (field) => err[`prescriptions.${i}.${field}`];
              return (
                <div key={it.key} className="medicine-card">
                  <div className="medicine-card-heading">
                    <span>Medicine {i + 1}</span>
                    <button type="button" onClick={() => removeItem(it.key)} className="table-action delete-action"><Trash2 size={14} /> Remove</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Medicine" required error={e("medicine_name")}>
                      <input className={inputClass} maxLength={150} value={it.medicine_name} onChange={setItem(it.key, "medicine_name")} />
                    </Field>
                    <Field label="Dosage" required error={e("dosage")}>
                      <input className={inputClass} maxLength={50} placeholder="e.g. 500mg" value={it.dosage} onChange={setItem(it.key, "dosage")} />
                    </Field>
                    <Field label="Frequency" required error={e("frequency")}>
                      <input className={inputClass} maxLength={100} placeholder="e.g. 3 times a day" value={it.frequency} onChange={setItem(it.key, "frequency")} />
                    </Field>
                    <Field label="Duration (days)" required error={e("duration_days")}>
                      <input type="number" className={inputClass} value={it.duration_days} onChange={setItem(it.key, "duration_days")} />
                    </Field>
                  </div>

                  <div className="mt-3">
                    <Field label="Instructions" error={e("instructions")}>
                      <input className={inputClass} maxLength={255} placeholder="e.g. After meals" value={it.instructions} onChange={setItem(it.key, "instructions")} />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="primary-button">
            {submitting ? "Saving..." : <><Save size={17} /> {isEdit ? "Save changes" : "Save and complete appointment"}</>}
          </button>
          <Link to={isEdit ? `/consultations/${id}` : "/appointments"} className="secondary-button">Cancel</Link>
        </div>
      </form>
    </div>
  );
}