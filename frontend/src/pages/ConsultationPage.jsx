import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getConsultation } from "../api/consultations";
import useFlash from "../hooks/useFlash";
import { friendlyMessage } from "../lib/errors";
import { ArrowLeft, ClipboardCheck, Edit3, FileText, HeartPulse } from "lucide-react";

export default function ConsultationPage() {
  const { id } = useParams();
  const [flash, setFlash] = useFlash();
  const [c, setC] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setC(null);
    setError("");

    getConsultation(id)
      .then((data) => !ignore && setC(data))
      .catch((err) => !ignore && setError(friendlyMessage(err)));

    return () => {
      ignore = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="form-state page-enter">
        <div className="patients-error">{error}</div>
        <Link to="/appointments" className="back-link"><ArrowLeft size={15} /> Back to appointments</Link>
      </div>
    );
  }
  if (!c) return <div className="dashboard-loading"><span /><p>Loading consultation record...</p></div>;

  return (
    <div className="consultation-detail-page page-enter">
      {flash && (
        <div className="patient-flash">
          <span>{flash}</span>
          <button onClick={() => setFlash("")} aria-label="Dismiss">×</button>
        </div>
      )}

      <Link to="/appointments" className="back-link"><ArrowLeft size={15} /> Back to appointments</Link>
      <div className="consultation-detail-heading">
        <div>
          <p className="eyebrow">Completed care record</p><h1>Consultation</h1>
          <p className="detail-patient-name"><HeartPulse size={16} />
            {c.patient.full_name} <span className="font-mono text-xs">{c.patient.patient_number}</span>
          </p>
          <p className="detail-meta">
            {c.appointment.date} at {c.appointment.start_time} · {c.doctor.name} ({c.doctor.specialization})
          </p>
        </div>
        <div className="detail-actions">
          <Link to={`/patients/${c.patient.id}/history`} className="secondary-button">Patient history</Link>
          <Link to={`/consultations/${c.id}/edit`} className="primary-button"><Edit3 size={15} /> Edit</Link>
        </div>
      </div>

      <div className="consultation-detail-card patient-form-card">
        <Section title="Symptoms" text={c.symptoms} />
        <Section title="Diagnosis" text={c.diagnosis} />
        <Section title="Notes" text={c.notes} />
        <Section title="Follow-up date" text={c.follow_up_date} />

        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Prescription</h2>
          {c.prescriptions.length === 0 ? (
            <p className="text-gray-500 text-sm">No medicines prescribed.</p>
          ) : (
            <table className="directory-table prescription-table">
              <thead>
                <tr>
                  <th className="py-1 pr-3">Medicine</th>
                  <th className="py-1 pr-3">Dosage</th>
                  <th className="py-1 pr-3">Frequency</th>
                  <th className="py-1 pr-3">Days</th>
                  <th className="py-1">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {c.prescriptions.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2 pr-3 font-medium">{p.medicine_name}</td>
                    <td className="py-2 pr-3">{p.dosage}</td>
                    <td className="py-2 pr-3">{p.frequency}</td>
                    <td className="py-2 pr-3">{p.duration_days}</td>
                    <td className="py-2">{p.instructions ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, text }) {
  return (
    <div className="detail-section">
      <h2><FileText size={15} /> {title}</h2>
      <p>{text || "—"}</p>
    </div>
  );
}