import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPatientHistory } from "../api/consultations";
import { getPatient } from "../api/patients";
import Pagination from "../components/Pagination";
import { friendlyMessage } from "../lib/errors";
import { ArrowLeft, CalendarDays, ClipboardCheck, HeartPulse } from "lucide-react";

export default function PatientHistoryPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // History items carry no patient block (see Swagger), so fetch the patient separately
  useEffect(() => {
    getPatient(id).then(setPatient).catch(() => {}); // a 404 is reported by the history request below
  }, [id]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    getPatientHistory(id, { page, per_page: 5 })
      .then((data) => !ignore && setResult(data))
      .catch((err) => !ignore && setError(friendlyMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [id, page]);

  const { items, meta } = result;

  return (
    <div className="history-page page-enter">
      <Link to="/patients" className="back-link"><ArrowLeft size={15} /> Back to patients</Link>
      <div className="history-heading"><div><p className="eyebrow">Longitudinal care</p><h1>Consultation history</h1></div><div className="form-security"><ClipboardCheck size={17} /> Doctor workspace</div></div>
      {patient && (
        <div className="history-patient"><span className="doctor-avatar"><HeartPulse size={16} /></span><span><strong>{patient.full_name}</strong><small>{patient.patient_number} · {patient.age} years · {patient.gender}{patient.blood_group && ` · ${patient.blood_group}`}</small></span></div>
      )}

      {error && <div className="patients-error">{error}</div>}
      {loading && items.length === 0 && <div className="dashboard-loading"><span /><p>Loading consultation history...</p></div>}

      {!loading && !error && items.length === 0 && (
        <p className="empty-history"><CalendarDays size={22} /> No consultations yet.</p>
      )}

      <div className={`history-list ${loading ? "is-loading" : ""}`}>
        {items.map((c) => (
          <div key={c.id} className="history-card">
            <div className="history-card-top">
              <span>{c.appointment.date}</span>
              <span>{c.doctor.name} · {c.doctor.specialization}</span>
            </div>
            <p className="history-diagnosis">{c.diagnosis}</p>
            {c.prescriptions.length > 0 && (
              <p className="history-prescription">
                Rx: {c.prescriptions.map((p) => `${p.medicine_name} ${p.dosage}`).join(", ")}
              </p>
            )}
            <Link to={`/consultations/${c.id}`} className="text-button">View full record <ArrowLeft size={14} className="forward-icon" /></Link>
          </div>
        ))}
      </div>

      <Pagination meta={meta} loading={loading} onPage={setPage} noun="consultations" />
    </div>
  );
}