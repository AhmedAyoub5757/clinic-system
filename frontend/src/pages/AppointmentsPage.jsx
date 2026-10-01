import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  cancelAppointment,
  confirmAppointment,
  listAppointments,
} from "../api/appointments";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import useFlash from "../hooks/useFlash";
import { friendlyMessage } from "../lib/errors";
import {
  CalendarDays,
  Check,
  CircleX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { todayString } from "../lib/dates";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

const SORT_OPTIONS = [
  { value: "-appointment_date", label: "Latest first" },
  { value: "appointment_date", label: "Soonest first" },
  { value: "-created_at", label: "Recently booked" },
];

// The API's allowed_transitions is state-based only. This is the role-based half.
// (Completing is done by the doctor through a consultation, built in a later part.)
const ROLE_ACTIONS = {
  receptionist: ["confirmed", "cancelled"],
  doctor: ["completed"],
};

function actionsFor(appointment, role) {
  const roleCan = ROLE_ACTIONS[role] ?? [];
  return appointment.allowed_transitions.filter((t) => roleCan.includes(t));
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const canBook = user.role === "receptionist";
  const [flash, setFlash] = useFlash();

  const [filters, setFilters] = useState({
    status: "",
    date: user.role === "doctor" ? todayString() : "",
    sort: user.role === "doctor" ? "appointment_date" : "-appointment_date",
    page: 1,
  });
  const update = (changes) =>
    setFilters((f) => ({ ...f, page: 1, ...changes }));

  const [result, setResult] = useState({ items: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  // Cancel modal
  const [toCancel, setToCancel] = useState(null);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    let ignore = false;
    // The request lifecycle owns these flags so the schedule reflects the active filters immediately.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    listAppointments({ ...filters, per_page: 10 })
      .then((data) => !ignore && setResult(data))
      .catch((err) => !ignore && setError(err))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [filters.status, filters.date, filters.sort, filters.page, reloadKey]);

  // confirm and cancel return the updated appointment, so swap the row in place
  function replaceItem(updated) {
    setResult((r) => ({
      ...r,
      items: r.items.map((a) => (a.id === updated.id ? updated : a)),
    }));
  }

  async function handleConfirm(appointment) {
    setBusyId(appointment.id);
    setActionError("");
    setFlash("");

    try {
      replaceItem(await confirmAppointment(appointment.id));
      setFlash("Appointment confirmed");
    } catch (err) {
      setActionError(friendlyMessage(err));
      // 409: someone else changed it first, so show the real current state
      if (err.status === 409) setReloadKey((k) => k + 1);
    } finally {
      setBusyId(null);
    }
  }

  function openCancel(appointment) {
    setToCancel(appointment);
    setReason("");
    setCancelError("");
  }

  async function submitCancel(e) {
    e.preventDefault();
    setCancelling(true);
    setCancelError("");

    try {
      replaceItem(await cancelAppointment(toCancel.id, reason));
      setToCancel(null);
      setFlash("Appointment cancelled");
    } catch (err) {
      if (err.status === 422)
        setCancelError(err.errors?.cancellation_reason?.[0] ?? err.message);
      else setCancelError(friendlyMessage(err));
      if (err.status === 409) setReloadKey((k) => k + 1);
    } finally {
      setCancelling(false);
    }
  }

  const { items, meta } = result;
  // const showActions = canBook;
  const isDoctor = user.role === "doctor";
  const showActions = canBook || isDoctor;

  return (
    <div className="directory-page appointments-page page-enter">
      <div className="page-heading directory-heading">
        <div>
          <p className="eyebrow">Care schedule</p>
          <h1>Appointments</h1>
          <p className="page-subtitle">
            Keep today’s visits moving and every slot accounted for.
          </p>
        </div>
        <div className="directory-count">
          <CalendarDays size={17} />
          <strong>{meta?.total ?? "--"}</strong> appointments
        </div>
      </div>
      <div className="directory-heading-actions">
        {canBook && (
          <Link to="/appointments/new" className="primary-button">
            <CalendarDays size={17} />
            Book appointment
          </Link>
        )}
      </div>

      {flash && (
        <div className="patient-flash">
          <span>{flash}</span>
          <button onClick={() => setFlash("")} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}
      {actionError && <div className="patients-error">{actionError}</div>}

      <div className="directory-toolbar">
        <span className="filter-label">
          <SlidersHorizontal size={15} /> Filter schedule
        </span>
        <select
          value={filters.status}
          onChange={(e) => update({ status: e.target.value })}
          className="directory-select"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.date}
          onChange={(e) => update({ date: e.target.value })}
          className="directory-select"
        />

        <select
          value={filters.sort}
          onChange={(e) => update({ sort: e.target.value })}
          className="directory-select"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {filters.date && (
          <button onClick={() => update({ date: "" })} className="clear-filter">
            <CircleX size={14} /> Clear date
          </button>
          
        )}
        <button onClick={() => update({ date: todayString() })} className="text-sm text-blue-600">Today</button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
          {friendlyMessage(error)}
        </div>
      )}

      <div className={`directory-table-wrap ${loading ? "is-loading" : ""}`}>
        <table className="directory-table appointment-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Status</th>
              {showActions && <th className="actions-heading">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((a) => {
              const actions = actionsFor(a, user.role);
              return (
                <tr key={a.id}>
                  <td className="date-cell">{a.appointment_date}</td>
                  <td className="time-cell">
                    {a.start_time}–{a.end_time}
                  </td>
                  <td>
                    <div className="record-name">{a.patient?.full_name}</div>
                    <small className="record-meta">
                      {a.patient?.patient_number}
                    </small>
                  </td>
                  <td>
                    <div className="record-name">{a.doctor?.name}</div>
                    <small className="record-meta">
                      {a.doctor?.specialization}
                    </small>
                  </td>
                  <td>
                    <StatusBadge status={a.status} />
                    {a.cancellation_reason && (
                      <div className="record-meta cancellation-note">
                        Reason: {a.cancellation_reason}
                      </div>
                    )}
                  </td>
                  {showActions && (
                    <td className="appointment-actions">
                      {actions.includes("confirmed") && (
                        <button
                          onClick={() => handleConfirm(a)}
                          disabled={busyId === a.id}
                          className="table-action edit-action"
                        >
                          {busyId === a.id ? (
                            "..."
                          ) : (
                            <>
                              <Check size={14} /> Confirm
                            </>
                          )}
                        </button>
                      )}
                      {actions.includes("cancelled") && (
                        <button
                          onClick={() => openCancel(a)}
                          className="table-action delete-action"
                        >
                          <CircleX size={14} /> Cancel
                        </button>
                      )}
                      {actions.includes("completed") && a.appointment_date <= todayString() && (
                        <Link to={`/appointments/${a.id}/consultation/new`} className="text-blue-600">Record consultation</Link>
                      )}
                      {isDoctor && a.status === "completed" && a.consultation_id && (
                        <Link to={`/consultations/${a.consultation_id}`} className="text-blue-600">View consultation</Link>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}

            {!loading && !error && items.length === 0 && (
              <tr>
                <td colSpan={showActions ? 6 : 5} className="empty-state">
                  No appointments match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && items.length === 0 && (
          <p className="loading-state">
            <span /> Loading appointment schedule...
          </p>
        )}
      </div>

      <Pagination
        meta={meta}
        loading={loading}
        onPage={(page) => setFilters((f) => ({ ...f, page }))}
        noun="appointments"
      />

      {toCancel && (
        <div
          className="delete-overlay"
          onMouseDown={(e) =>
            e.target === e.currentTarget && !cancelling && setToCancel(null)
          }
        >
          <form onSubmit={submitCancel} className="delete-dialog cancel-dialog">
            <div className="delete-icon">
              <CircleX size={21} />
            </div>
            <h2>Cancel appointment?</h2>
            <p>
              {toCancel.patient?.full_name} with {toCancel.doctor?.name} on{" "}
              {toCancel.appointment_date} at {toCancel.start_time}. The slot
              becomes available again.
            </p>

            <label className="modal-label">Reason for cancelling *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              required
              className="patient-form-input modal-textarea"
            />

            {cancelError && <div className="patients-error">{cancelError}</div>}

            <div className="delete-actions">
              <button
                type="button"
                onClick={() => setToCancel(null)}
                disabled={cancelling}
                className="secondary-button"
              >
                Keep appointment
              </button>
              <button
                type="submit"
                disabled={cancelling}
                className="danger-button"
              >
                {cancelling ? "Cancelling..." : "Cancel appointment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
