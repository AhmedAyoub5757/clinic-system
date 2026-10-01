import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAppointment, getAvailability, rescheduleAppointment } from "../api/appointments";
import StatusBadge from "../components/StatusBadge";
import { todayString } from "../lib/dates";
import { friendlyMessage } from "../lib/errors";

const EDITABLE = ["pending", "confirmed"]; // Swagger: other statuses return 409

export default function RescheduleAppointmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appt, setAppt] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [slot, setSlot] = useState("");

  const [availability, setAvailability] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let ignore = false;
    getAppointment(id)
      .then((a) => {
        if (ignore) return;
        setAppt(a);
        setDate(a.appointment_date);
        setReason(a.reason ?? "");
      })
      .catch((err) => !ignore && setLoadError(friendlyMessage(err)));
    return () => {
      ignore = true;
    };
  }, [id]);

  const doctorId = appt?.doctor?.id;

  useEffect(() => {
    setSlot("");
    setAvailability(null);
    setSlotsError("");
    if (!doctorId || !date) return;

    let ignore = false;
    setSlotsLoading(true);

    getAvailability(doctorId, date)
      .then((data) => !ignore && setAvailability(data))
      .catch((err) => {
        if (!ignore) setSlotsError(err.status === 422 ? err.errors?.date?.[0] ?? err.message : friendlyMessage(err));
      })
      .finally(() => !ignore && setSlotsLoading(false));

    return () => {
      ignore = true;
    };
  }, [doctorId, date, reloadKey]);

  if (loadError) {
    return (
      <div className="page-enter">
        <div className="patients-error">{loadError}</div>
        <Link to="/appointments" className="back-link">Back to appointments</Link>
      </div>
    );
  }
  if (!appt) return <p className="loading-state"><span /> Loading appointment...</p>;

  if (!EDITABLE.includes(appt.status)) {
    return (
      <div className="page-enter">
        <div className="patients-error">
          This appointment is {appt.status}, so it can no longer be changed. Cancel and rebook if needed.
        </div>
        <Link to="/appointments" className="back-link">Back to appointments</Link>
      </div>
    );
  }

  const dateChanged = date !== appt.appointment_date;
  const reasonChanged = reason.trim() !== (appt.reason ?? "");
  // A new date is meaningless without a new time
  const ready = (slot || reasonChanged) && !(dateChanged && !slot);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    // Send only what changed (Swagger: AppointmentUpdateInput)
    const payload = {};
    if (slot) {
      payload.start_time = slot;
      if (dateChanged) payload.appointment_date = date;
    }
    if (reasonChanged) payload.reason = reason.trim();

    setSubmitting(true);
    try {
      await rescheduleAppointment(id, payload);
      navigate("/appointments", {
        state: { flash: slot ? `Moved to ${date} at ${slot}` : "Appointment updated" },
      });
    } catch (err) {
      if (err.status === 409) {
        // Slot taken in the meantime, or the status changed under us
        setFormError(err.message);
        setReloadKey((k) => k + 1);
      } else if (err.status === 422) {
        setFieldErrors(err.errors || {});
        setFormError("Please fix the highlighted fields.");
      } else {
        setFormError(friendlyMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const err = fieldErrors;

  return (
    <div className="booking-page reschedule-page page-enter">
      <div className="form-page-heading">
        <div>
          <p className="eyebrow">Care schedule</p>
          <h1>Reschedule appointment</h1>
          <p className="page-subtitle">Move the visit while keeping the patient and clinician linked.</p>
        </div>
      </div>

      <div className="appointment-context">
        <div className="appointment-context-heading">
          <div>
            <p className="font-medium">{appt.patient.full_name} <span className="font-mono text-xs text-gray-500">{appt.patient.patient_number}</span></p>
            <p className="text-gray-600">{appt.doctor.name} · {appt.doctor.specialization}</p>
          </div>
          <StatusBadge status={appt.status} />
        </div>
        <p className="mt-2 text-gray-600">Currently: {appt.appointment_date} at {appt.start_time}</p>
        <p className="text-xs text-gray-400 mt-1">Patient and doctor can't be changed. Cancel and rebook for that.</p>
      </div>

      <form onSubmit={handleSubmit} className="patient-form-card reschedule-card">
        {formError && <div className="form-alert">{formError}</div>}

        <div>
          <label>New date</label>
          <input
            type="date"
            value={date}
            min={todayString()}
            onChange={(e) => setDate(e.target.value)}
            className="patient-form-input date-input"
          />
          {err.appointment_date && <p className="text-red-600 text-sm mt-1">{err.appointment_date[0]}</p>}
        </div>

        <div>
          <label>
            New time
            {availability && (
              <span className="font-normal text-gray-500"> · {availability.day}, {availability.slot_duration}-minute slots</span>
            )}
          </label>

          {slotsLoading && <p className="loading-state"><span /> Loading available times...</p>}
          {slotsError && <div className="patients-error">{slotsError}</div>}

          {availability && availability.slots.length === 0 && (
            <p className="no-slots-message">No free times on {availability.day}. Try another date.</p>
          )}

          {availability && availability.slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availability.slots.map((s) => (
                <button
                  type="button"
                  key={s.start}
                  onClick={() => setSlot(s.start)}
                  className={`border rounded px-3 py-1.5 text-sm ${
                    slot === s.start ? "time-slot is-selected" : "time-slot"
                  }`}
                >
                  {s.start}
                </button>
              ))}
            </div>
          )}

          {!dateChanged && availability && (
            <p className="text-xs text-gray-400 mt-2">
              Your current time ({appt.start_time}) isn't listed because this appointment is holding it.
            </p>
          )}
          {err.start_time && <p className="text-red-600 text-sm mt-2">{err.start_time[0]}</p>}
        </div>

        <div>
          <label>Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={2}
            className="patient-form-input modal-textarea"
          />
          {err.reason && <p className="text-red-600 text-sm mt-1">{err.reason[0]}</p>}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={!ready || submitting} className="primary-button">
            {submitting ? "Saving..." : "Save changes"}
          </button>
          <Link to="/appointments" className="secondary-button">Cancel</Link>
        </div>
      </form>
    </div>
  );
}