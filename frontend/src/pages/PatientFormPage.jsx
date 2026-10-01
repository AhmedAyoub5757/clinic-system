import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createPatient, getPatient, updatePatient } from "../api/patients";
import { ArrowLeft, Check, ClipboardList, HeartPulse, ShieldCheck } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Same field names as Swagger's PatientInput, so 422 error keys match 1:1
const EMPTY = {
  first_name: "", last_name: "", gender: "", date_of_birth: "", phone: "",
  email: "", national_id: "", blood_group: "", address: "",
  emergency_contact_name: "", emergency_contact_phone: "",
};

// API output (nested emergency_contact, nulls) → form state (flat, no nulls)
function toForm(p) {
  return {
    first_name: p.first_name,
    last_name: p.last_name,
    gender: p.gender,
    date_of_birth: p.date_of_birth,
    phone: p.phone,
    email: p.email ?? "",
    national_id: p.national_id ?? "",
    blood_group: p.blood_group ?? "",
    address: p.address ?? "",
    emergency_contact_name: p.emergency_contact?.name ?? "",
    emergency_contact_phone: p.emergency_contact?.phone ?? "",
  };
}

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

export default function PatientFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY); // what the server gave us, for diffing
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Edit mode: load the patient first
  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;

    getPatient(id)
      .then((patient) => {
        if (ignore) return;
        const values = toForm(patient);
        setForm(values);
        setInitial(values);
      })
      .catch((err) => !ignore && setLoadError(err))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    let payload;
    if (isEdit) {
      // Swagger: "send only the fields that changed"
      payload = Object.fromEntries(Object.entries(form).filter(([key, value]) => value !== initial[key]));
      if (Object.keys(payload).length === 0) {
        setFormError("No changes to save.");
        return;
      }
    } else {
      // Omit empty optional fields instead of sending ""
      payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ""));
    }

    setSubmitting(true);
    try {
      const patient = isEdit ? await updatePatient(id, payload) : await createPatient(payload);

      navigate("/patients", {
        state: {
          flash: isEdit
            ? `${patient.full_name} updated`
            : `Patient ${patient.patient_number} registered`,
        },
      });
    } catch (err) {
      // One branch per documented status
      if (err.status === 422) {
        setFieldErrors(err.errors || {});
        setFormError("Please fix the highlighted fields.");
      } else if (err.status === 429) {
        setFormError(`Too many requests. Try again in ${err.retryAfter ?? 60} seconds.`);
      } else {
        setFormError(err.message); // 403, 404, network error
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  if (loadError) {
    return (
      <div className="form-state page-enter">
        <div className="patients-error">{loadError.message}</div>
        <Link to="/patients" className="back-link"><ArrowLeft size={15} /> Back to patients</Link>
      </div>
    );
  }

  const err = fieldErrors;

  return (
    <div className="patient-form-page page-enter">
      <Link to="/patients" className="back-link"><ArrowLeft size={15} /> Back to patients</Link>
      <div className="form-page-heading"><div><p className="eyebrow">Patient records</p><h1>{isEdit ? "Edit patient" : "New patient"}</h1><p className="page-subtitle">{isEdit ? "Update the details in this patient record." : "Create a complete record for a new patient."}</p></div><div className="form-security"><ShieldCheck size={17} /> Private & secure</div></div>

      <form onSubmit={handleSubmit} className="patient-form-card">
        {formError && <div className="patients-error form-error">{formError}</div>}

        <div className="form-section"><div className="form-section-heading"><span className="section-icon"><ClipboardList size={17} /></span><div><h2>Basic information</h2><p>Personal details used for identification.</p></div></div><div className="form-grid">
          <Field label="First name" required error={err.first_name}>
            <input className={inputClass} value={form.first_name} onChange={set("first_name")} maxLength={100} required />
          </Field>

          <Field label="Last name" required error={err.last_name}>
            <input className={inputClass} value={form.last_name} onChange={set("last_name")} maxLength={100} required />
          </Field>

          <Field label="Gender" required error={err.gender}>
            <select className={inputClass} value={form.gender} onChange={set("gender")} required>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="Date of birth" required error={err.date_of_birth}>
            <input type="date" className={inputClass} value={form.date_of_birth} onChange={set("date_of_birth")} required />
          </Field>

          <Field label="Phone" required error={err.phone}>
            <input className={inputClass} value={form.phone} onChange={set("phone")} maxLength={20} required />
          </Field>

          <Field label="Email" error={err.email}>
            <input type="email" className={inputClass} value={form.email} onChange={set("email")} maxLength={255} />
          </Field>

          <Field label="National ID (CNIC)" error={err.national_id}>
            <input className={inputClass} value={form.national_id} onChange={set("national_id")} maxLength={20} />
          </Field>

          <Field label="Blood group" error={err.blood_group}>
            <select className={inputClass} value={form.blood_group} onChange={set("blood_group")}>
              <option value="">Unknown</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
        </div></div>

        <div className="form-section"><div className="form-section-heading"><span className="section-icon"><HeartPulse size={17} /></span><div><h2>Additional details</h2><p>Contact and care information for the clinical team.</p></div></div><Field label="Address" error={err.address}>
          <textarea className={inputClass} rows={2} value={form.address} onChange={set("address")} maxLength={500} />
        </Field>

        <div className="form-grid">
          <Field label="Emergency contact name" error={err.emergency_contact_name}>
            <input className={inputClass} value={form.emergency_contact_name} onChange={set("emergency_contact_name")} maxLength={255} />
          </Field>

          <Field label="Emergency contact phone" error={err.emergency_contact_phone}>
            <input className={inputClass} value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} maxLength={20} />
          </Field>
        </div></div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={submitting}
            className="primary-button"
          >
            {submitting ? "Saving..." : <><Check size={17} /> {isEdit ? "Save changes" : "Register patient"}</>}
          </button>
          <Link to="/patients" className="secondary-button">Cancel</Link>
        </div>
      </form>
    </div>
  );
}