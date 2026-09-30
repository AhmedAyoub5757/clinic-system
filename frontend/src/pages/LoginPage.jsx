import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFieldErrors({});

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      // One branch per documented response code
      if (err.status === 422) {
        setFieldErrors(err.errors || {});
      } else if (err.status === 429) {
        setFormError(`Too many attempts. Try again in ${err.retryAfter ?? 60} seconds.`);
      } else {
        setFormError(err.message); // 401 "Invalid credentials", or network error
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-split" aria-label="Clinic account sign in">
        <div className="login-panel login-panel-brand">
          <div className="brand-lockup"><span>+</span><strong>northstar</strong><small>clinic</small></div>
          <div className="brand-message">
            <p className="panel-kicker">Care, simplified</p>
            <h1>Good care<br />starts here.</h1>
            <p>Everything your team needs to keep every visit moving with clarity.</p>
          </div>
          <div className="panel-index">01 / 01</div>
        </div>

        <div className="login-panel login-panel-form">
        <form onSubmit={handleSubmit} className="login-card">
          <div className="login-card-heading">
            <div>
              <p className="panel-kicker">Welcome back</p>
              <h2>Sign in</h2>
            </div>
            <span className="secure-badge" title="Secure sign in" aria-label="Secure sign in">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.9 8.5 7 10 4.1-1.5 7-5.5 7-10V6l-7-3Z" /><path d="m9.5 12 1.7 1.7 3.5-3.7" /></svg>
            </span>
          </div>

          {formError && <div className="form-alert" role="alert">{formError}</div>}

          <div className="field-group">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required aria-invalid={Boolean(fieldErrors.email)} className={fieldErrors.email ? "input-error" : ""} />
            {fieldErrors.email && <p className="field-error" role="alert">{fieldErrors.email[0]}</p>}
          </div>

          <div className="field-group">
            <div className="field-label-row"><label htmlFor="password">Password</label><span className="field-hint">Keep it private</span></div>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required aria-invalid={Boolean(fieldErrors.password)} className={fieldErrors.password ? "input-error" : ""} />
            {fieldErrors.password && <p className="field-error" role="alert">{fieldErrors.password[0]}</p>}
          </div>

          <button type="submit" disabled={submitting} className="login-button"><span>{submitting ? "Signing in..." : "Enter workspace"}</span>{!submitting && <span className="button-arrow" aria-hidden="true">↗</span>}</button>
          <p className="login-footer">Encrypted access · private by design</p>
        </form>
          <p className="form-copyright">Northstar Clinic <span>·</span> Secure workspace</p>
        </div>
      </section>
    </main>
  );
}