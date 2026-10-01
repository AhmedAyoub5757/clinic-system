import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createDoctor, getDoctor, updateDoctor } from "../api/doctors";
import { listUsers } from "../api/users";
import useFlash from "../hooks/useFlash";
import { friendlyMessage } from "../lib/errors";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // clinics think Monday-first, the API says 0 = Sunday

const inputClass = "patient-form-input";
const EMPTY = {
  user_id: "", specialization: "", license_number: "", phone: "",
  consultation_fee: "", slot_duration: "30", bio: "", is_active: true,
};

const defaultRows = () =>
  DAY_ORDER.map((d) => ({ day_of_week: d, enabled: false, start_time: "09:00", end_time: "17:00" }));

// API schedules → editor rows
function rowsFromSchedules(schedules) {
  const rows = defaultRows();
  schedules.forEach((s) => {
    const row = rows.find((r) => r.day_of_week === s.day_of_week);
    row.enabled = true;
    row.start_time = s.start_time;
    row.end_time = s.end_time;
  });
  return rows;
}

// Editor rows → API payload (ScheduleInput[]). Sorted so comparisons and error indexes are stable.
function buildSchedules(rows) {
  return rows
    .filter((r) => r.enabled)
    .map(({ day_of_week, start_time, end_time }) => ({ day_of_week, start_time, end_time }))
    .sort((a, b) => a.day_of_week - b.day_of_week);
}

function Field({ label, error, required, hint, children }) {
  return (
    <div className="field-group">
      <label>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error[0]}</p>}
    </div>
  );
}

export default function DoctorFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [query] = useSearchParams();
  const [flash, setFlash] = useFlash();

  const [form, setForm] = useState({ ...EMPTY, user_id: query.get("user_id") ?? "" });
  const [rows, setRows] = useState(defaultRows());
  const [initial, setInitial] = useState({ form: EMPTY, schedulesJson: "[]" });
  const [doctorName, setDoctorName] = useState("");

  const [candidates, setCandidates] = useState([]); // doctor-role users without a profile (create only)
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        if (isEdit) {
          const d = await getDoctor(id);
          if (ignore) return;
          const values = {
            user_id: String(d.user_id),
            specialization: d.specialization,
            license_number: d.license_number,
            phone: d.phone ?? "",
            // "1000.00" → "1000", so an untouched field compares equal and isn't re-sent
            consultation_fee: String(Number(d.consultation_fee)),
            slot_duration: String(d.slot_duration),
            bio: d.bio ?? "",
            is_active: d.is_active,
          };
          const r = rowsFromSchedules(d.schedules);
          setForm(values);
          setRows(r);
          setInitial({ form: values, schedulesJson: JSON.stringify(buildSchedules(r)) });
          setDoctorName(`${d.name} · ${d.email}`);
        } else {
          // Needs the new filters from Part B
          const data = await listUsers({ role: "doctor", without_doctor_profile: 1, per_page: 100 });
          if (!ignore) setCandidates(data.items);
        }
      } catch (err) {
        if (!ignore) setLoadError(friendlyMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));
  const setRow = (day, changes) => setRows((rs) => rs.map((r) => (r.day_of_week === day ? { ...r, ...changes } : r)));

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const schedules = buildSchedules(rows);
    let payload;

    if (isEdit) {
      payload = {};
      const convert = {
        consultation_fee: Number,
        slot_duration: Number,
        is_active: Boolean,
      };
      for (const name of ["specialization", "license_number", "phone", "consultation_fee", "slot_duration", "bio", "is_active"]) {
        if (form[name] !== initial.form[name]) payload[name] = (convert[name] ?? ((v) => v.trim()))(form[name]);
      }
      // Whole list or nothing: the API replaces the old schedules
      if (JSON.stringify(schedules) !== initial.schedulesJson) payload.schedules = schedules;

      if (Object.keys(payload).length === 0) {
        setFormError("No changes to save.");
        return;
      }
    } else {
      payload = {
        user_id: Number(form.user_id),
        specialization: form.specialization.trim(),
        license_number: form.license_number.trim(),
        consultation_fee: Number(form.consultation_fee),
        slot_duration: Number(form.slot_duration),
        ...(form.phone.trim() && { phone: form.phone.trim() }),
        ...(form.bio.trim() && { bio: form.bio.trim() }),
        schedules,
      };
    }

    setSubmitting(true);
    try {
      const d = isEdit ? await updateDoctor(id, payload) : await createDoctor(payload);
      navigate("/doctors", { state: { flash: isEdit ? `${d.name} updated` : `Profile created for ${d.name}` } });
    } catch (err) {
      if (err.status === 422) {
        setFieldErrors(err.errors || {});
        setFormError("Please fix the highlighted fields.");
      } else {
        setFormError(friendlyMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="loading-state"><span /> Loading doctor profile...</p>;
  if (loadError) {
    return (
      <div className="page-enter">
        <div className="patients-error">{loadError}</div>
        <Link to="/doctors" className="back-link">Back to doctors</Link>
      </div>
    );
  }

  const err = fieldErrors;
  const payloadSchedules = buildSchedules(rows);
  // API error keys use the position in the array WE SENT, not the row's position on screen
  const rowError = (day, field) => {
    const index = payloadSchedules.findIndex((s) => s.day_of_week === day);
    return index >= 0 ? err[`schedules.${index}.${field}`] : undefined;
  };

  return (
    <div className="patient-form-page doctor-form-page page-enter">
      <div className="form-page-heading">
        <div>
          <p className="eyebrow">Clinical directory</p>
          <h1>{isEdit ? "Edit doctor profile" : "New doctor profile"}</h1>
          {isEdit && <p className="page-subtitle">{doctorName}</p>}
        </div>
      </div>

      {flash && (
        <div className="patient-flash">
          <span>{flash}</span>
          <button onClick={() => setFlash("")} aria-label="Dismiss">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="patient-form-card doctor-form-card">
        {formError && <div className="form-alert">{formError}</div>}

        {!isEdit && (
          <Field
            label="Doctor account"
            required
            error={err.user_id}
            hint="Only users with the doctor role and no profile yet are listed. Create the account first under Staff."
          >
            <select className={inputClass} value={form.user_id} onChange={set("user_id")} required>
              <option value="">Select...</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>{u.name} · {u.email}</option>
              ))}
            </select>
            {candidates.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No doctor accounts are waiting for a profile. <Link to="/users/new" className="text-blue-600">Create one</Link>.
              </p>
            )}
          </Field>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Specialization" required error={err.specialization}>
            <input className={inputClass} value={form.specialization} onChange={set("specialization")} maxLength={100} required />
          </Field>
          <Field label="License number" required error={err.license_number}>
            <input className={inputClass} value={form.license_number} onChange={set("license_number")} maxLength={50} required />
          </Field>
          <Field label="Consultation fee (Rs)" required error={err.consultation_fee}>
            <input type="number" min={0} max={1000000} className={inputClass} value={form.consultation_fee} onChange={set("consultation_fee")} required />
          </Field>
          <Field
            label="Slot length (minutes)"
            required
            error={err.slot_duration}
            hint={isEdit ? "Existing appointments are not moved if this changes." : undefined}
          >
            <input type="number" min={10} max={120} className={inputClass} value={form.slot_duration} onChange={set("slot_duration")} required />
          </Field>
          <Field label="Phone" error={err.phone}>
            <input className={inputClass} value={form.phone} onChange={set("phone")} maxLength={20} />
          </Field>
        </div>

        <Field label="Bio" error={err.bio}>
          <textarea className={inputClass} rows={2} maxLength={1000} value={form.bio} onChange={set("bio")} />
        </Field>

        {/* Schedule editor */}
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Working days</h2>
          {err.schedules && <p className="text-red-600 text-sm mb-2">{err.schedules[0]}</p>}

          <div className="doctor-schedule">
            {rows.map((r) => (
              <div key={r.day_of_week} className="doctor-schedule-row">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 w-36">
                    <input
                      type="checkbox"
                      checked={r.enabled}
                      onChange={(e) => setRow(r.day_of_week, { enabled: e.target.checked })}
                    />
                    <span className={r.enabled ? "font-medium" : "text-gray-400"}>{DAY_NAMES[r.day_of_week]}</span>
                  </label>

                  <input
                    type="time"
                    value={r.start_time}
                    disabled={!r.enabled}
                    onChange={(e) => setRow(r.day_of_week, { start_time: e.target.value })}
                    className="border rounded px-2 py-1 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    value={r.end_time}
                    disabled={!r.enabled}
                    onChange={(e) => setRow(r.day_of_week, { end_time: e.target.value })}
                    className="border rounded px-2 py-1 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                {["day_of_week", "start_time", "end_time"].map((f) => {
                  const e = rowError(r.day_of_week, f);
                  return e && <p key={f} className="text-red-600 text-sm mt-1">{e[0]}</p>;
                })}
              </div>
            ))}
          </div>
        </div>

        {isEdit && (
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <span>Active (can be booked)</span>
            </label>
            {!form.is_active && (
              <p className="text-xs text-gray-500 mt-1">
                Inactive doctors leave the booking list and cannot receive new appointments. Existing appointments stay.
                There is no delete: appointments and consultations must keep their doctor.
              </p>
            )}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="primary-button">
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create profile"}
          </button>
          <Link to="/doctors" className="secondary-button">Cancel</Link>
        </div>
      </form>
    </div>
  );
}