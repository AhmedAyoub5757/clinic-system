import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createUser, getUser, updateUser } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { friendlyMessage } from "../lib/errors";

const ROLES = ["admin", "doctor", "receptionist"];
const EMPTY = { name: "", email: "", password: "", role: "" };
const inputClass = "patient-form-input";

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

export default function UserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const isSelf = isEdit && Number(id) === me.id;

  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;

    getUser(id)
      .then((u) => {
        if (ignore) return;
        const values = { name: u.name, email: u.email, password: "", role: u.role };
        setForm(values);
        setInitial(values);
      })
      .catch((err) => !ignore && setLoadError(friendlyMessage(err)))
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
      payload = {};
      if (form.name !== initial.name) payload.name = form.name;
      if (form.email !== initial.email) payload.email = form.email;
      if (!isSelf && form.role !== initial.role) payload.role = form.role;
      if (form.password) payload.password = form.password; // blank means "keep the current one"

      if (Object.keys(payload).length === 0) {
        setFormError("No changes to save.");
        return;
      }
    } else {
      payload = { ...form };
    }

    setSubmitting(true);
    try {
      const saved = isEdit ? await updateUser(id, payload) : await createUser(payload);

      if (!isEdit && saved.role === "doctor") {
        // A doctor account is only half the job: continue to the profile
        navigate(`/doctors/new?user_id=${saved.id}`, {
          state: { flash: `Account created for ${saved.name}. Now add their doctor profile.` },
        });
      } else {
        navigate("/users", { state: { flash: isEdit ? `${saved.name} updated` : `${saved.name} created` } });
      }
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

  if (loading) return <p className="loading-state"><span /> Loading staff profile...</p>;
  if (loadError) {
    return (
      <div className="page-enter">
        <div className="patients-error">{loadError}</div>
        <Link to="/users" className="back-link">Back to staff</Link>
      </div>
    );
  }

  const err = fieldErrors;

  return (
    <div className="patient-form-page staff-form-page page-enter">
      <div className="form-page-heading">
        <div>
          <p className="eyebrow">Workspace access</p>
          <h1>{isEdit ? "Edit user" : "New user"}</h1>
          <p className="page-subtitle">Set account details and permissions for clinic staff.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="patient-form-card staff-form-card">
        {formError && <div className="form-alert">{formError}</div>}

        <Field label="Name" required error={err.name}>
          <input className={inputClass} value={form.name} onChange={set("name")} maxLength={255} required />
        </Field>

        <Field label="Email" required error={err.email}>
          <input type="email" className={inputClass} value={form.email} onChange={set("email")} maxLength={255} required />
        </Field>

        <Field
          label={isEdit ? "New password" : "Password"}
          required={!isEdit}
          error={err.password}
          hint={isEdit ? "Leave blank to keep the current password. Minimum 8 characters." : "Minimum 8 characters."}
        >
          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={set("password")}
            minLength={8}
            autoComplete="new-password"
            required={!isEdit}
          />
        </Field>

        <Field
          label="Role"
          required
          error={err.role}
          hint={isSelf ? "You can't change your own role." : undefined}
        >
          <select className={inputClass} value={form.role} onChange={set("role")} disabled={isSelf} required>
            <option value="">Select...</option>
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">{r}</option>
            ))}
          </select>
        </Field>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="primary-button">
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create user"}
          </button>
          <Link to="/users" className="secondary-button">Cancel</Link>
        </div>
      </form>
    </div>
  );
}