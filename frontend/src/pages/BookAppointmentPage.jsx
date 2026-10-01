import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { bookAppointment, getAvailability } from "../api/appointments";
import { listDoctors } from "../api/doctors";
import PatientPicker from "../components/PatientPicker";
import { friendlyMessage } from "../lib/errors";
import { todayString } from "../lib/dates";
import { ArrowLeft, CalendarClock, Check, Clock3 } from "lucide-react";

export default function BookAppointmentPage() {
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorsError, setDoctorsError] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  // Availability state: the three UI states a "load on demand" block needs
  const [availability, setAvailability] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [slot, setSlot] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Doctor dropdown (active doctors only, which is the API default). per_page max is 100.
  useEffect(() => {
    listDoctors({ per_page: 100, sort: "specialization" })
      .then((data) => setDoctors(data.items))
      .catch((err) => setDoctorsError(friendlyMessage(err)));
  }, []);

  // Whenever doctor or date changes: clear the old choice and load fresh slots
  useEffect(() => {
    // Reset dependent selections before loading the newly requested availability.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlot("");
    setAvailability(null);
    setSlotsError("");
    if (!doctorId || !date) return;

    let ignore = false;
    setSlotsLoading(true);

    getAvailability(doctorId, date)
      .then((data) => !ignore && setAvailability(data))
      .catch((err) => {
        if (ignore) return;
        // 422 here means a bad date (e.g. in the past)
        setSlotsError(err.status === 422 ? err.errors?.date?.[0] ?? err.message : friendlyMessage(err));
      })
      .finally(() => !ignore && setSlotsLoading(false));

    return () => {
      ignore = true;
    };
  }, [doctorId, date, reloadKey]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFieldErrors({});

    const payload = {
      patient_id: patient.id,
      doctor_id: Number(doctorId),
      appointment_date: date,
      start_time: slot, // the slot's `start` value, exactly as the API gave it
      ...(reason.trim() && { reason: reason.trim() }),
    };

    try {
      await bookAppointment(payload);
      navigate("/appointments", { state: { flash: `Booked ${patient.full_name} at ${slot} on ${date}` } });
    } catch (err) {
      if (err.status === 409) {
        // Valid request, but the calendar changed: someone else booked first
        setFormError(err.message);
        setReloadKey((k) => k + 1); // reloads the slots and clears the chosen one
      } else if (err.status === 422) {
        setFieldErrors(err.errors || {});
        setFormError("Please fix the highlighted fields.");
      } else {
        setFormError(friendlyMessage(err)); // 403, 429, network
      }
    } finally {
      setSubmitting(false);
    }
  }

  const err = fieldErrors;
  const ready = patient && doctorId && date && slot;
  const selectedDoctor = doctors.find((d) => String(d.id) === doctorId);

  return (
    <div className="booking-page page-enter">
      <Link to="/appointments" className="back-link"><ArrowLeft size={15} /> Back to appointments</Link>
      <div className="form-page-heading"><div><p className="eyebrow">Care schedule</p><h1>Book appointment</h1><p className="page-subtitle">Find a time that works for the patient and care team.</p></div><div className="form-security"><CalendarClock size={17} /> Live availability</div></div>

      <form onSubmit={handleSubmit} className="booking-card patient-form-card">
        {formError && <div className="patients-error form-error">{formError}</div>}

        {/* 1. Patient */}
        <div className="booking-step">
          <div className="booking-step-heading"><span>01</span><div><h2>Choose a patient</h2><p>Search the existing patient directory.</p></div></div>
          <PatientPicker value={patient} onChange={setPatient} error={err.patient_id} />
        </div>

        {/* 2. Doctor */}
        <div className="booking-step">
          <div className="booking-step-heading"><span>02</span><div><h2>Select a doctor</h2><p>Choose a specialist and review their fee.</p></div></div>
          {doctorsError && <p className="text-red-600 text-sm mb-1">{doctorsError}</p>}
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="patient-form-input"
          >
            <option value="">Select a doctor...</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.specialization} · Rs {Number(d.consultation_fee).toLocaleString()}
              </option>
            ))}
          </select>
          {err.doctor_id && <p className="text-red-600 text-sm mt-1">{err.doctor_id[0]}</p>}
        </div>

        {/* 3. Date */}
        <div className="booking-step">
          <div className="booking-step-heading"><span>03</span><div><h2>Pick a date</h2><p>Appointments are available from today onward.</p></div></div>
          <input
            type="date"
            value={date}
            min={todayString()}
            onChange={(e) => setDate(e.target.value)}
            className="patient-form-input date-input"
          />
          {err.appointment_date && <p className="text-red-600 text-sm mt-1">{err.appointment_date[0]}</p>}
        </div>

        {/* 4. Slots, loaded from the availability endpoint */}
        {doctorId && date && (
          <div className="booking-step slot-step">
            <div className="booking-step-heading"><span>04</span><div><h2>Choose a time</h2><p>Select an open slot from the live schedule.</p></div></div>
            <label className="availability-label">
              <Clock3 size={14} />
              {availability && (
                <span className="font-normal text-gray-500">
                  {" "}· {availability.day}, {availability.slot_duration}-minute slots
                </span>
              )}
            </label>

            {slotsLoading && <p className="loading-state"><span /> Loading available times...</p>}
            {slotsError && <div className="bg-red-50 text-red-700 text-sm p-3 rounded">{slotsError}</div>}

            {availability && availability.slots.length === 0 && (
              <p className="no-slots-message">
                No free times on {availability.day}. {selectedDoctor?.name} may not work that day, or it is fully booked.
                Try another date.
              </p>
            )}

            {availability && availability.slots.length > 0 && (
              <div className="time-slots">
                {availability.slots.map((s) => (
                  <button
                    type="button"
                    key={s.start}
                    onClick={() => setSlot(s.start)}
                    className={`time-slot ${
                      slot === s.start ? "is-selected" : ""
                    }`}
                  >
                    {s.start}
                  </button>
                ))}
              </div>
            )}

            {err.start_time && <p className="text-red-600 text-sm mt-2">{err.start_time[0]}</p>}
          </div>
        )}

        {/* 5. Reason */}
        <div className="booking-step">
          <div className="booking-step-heading"><span>05</span><div><h2>Visit reason <small>Optional</small></h2><p>Add context for the care team.</p></div></div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={2}
            className="patient-form-input"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={!ready || submitting}
            className="primary-button"
          >
            {submitting ? "Booking..." : <><Check size={17} /> Book appointment</>}
          </button>
          <Link to="/appointments" className="secondary-button">Cancel</Link>
        </div>
      </form>
    </div>
  );
}