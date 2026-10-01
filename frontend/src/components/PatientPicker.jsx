import { useEffect, useState } from "react";
import { Search, UserRound, X } from "lucide-react";
import { listPatients } from "../api/patients";
import useDebounce from "../hooks/useDebounce";

export default function PatientPicker({ value, onChange, error }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    if (value || !debouncedQuery.trim()) {
      // Clear stale results when the picker is reset or its query is empty.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([]);
      return undefined;
    }

    let ignore = false;
    setLoading(true);
    listPatients({ search: debouncedQuery.trim(), per_page: 6, sort: "last_name" })
      .then((data) => !ignore && setItems(data.items))
      .catch(() => !ignore && setItems([]))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [debouncedQuery, value]);

  function selectPatient(patient) {
    onChange(patient);
    setQuery("");
    setOpen(false);
  }

  function clearPatient() {
    onChange(null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="patient-picker">
      {value ? (
        <div className="selected-patient">
          <span className="doctor-avatar"><UserRound size={15} /></span>
          <span><strong>{value.full_name}</strong><small>{value.patient_number} · {value.phone}</small></span>
          <button type="button" onClick={clearPatient} aria-label="Change patient"><X size={16} /></button>
        </div>
      ) : (
        <>
          <div className="picker-search"><Search size={16} /><input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Search patient by name, phone, or number" /></div>
          {open && query.trim() && <div className="picker-results">
            {loading && <p className="picker-message">Searching patients...</p>}
            {!loading && items.length === 0 && <p className="picker-message">No matching patients found.</p>}
            {!loading && items.map((patient) => <button type="button" className="picker-result" key={patient.id} onClick={() => selectPatient(patient)}><span className="doctor-avatar">{patient.full_name.slice(0, 1)}</span><span><strong>{patient.full_name}</strong><small>{patient.patient_number} · {patient.phone}</small></span></button>)}
          </div>}
        </>
      )}
      {error && <p className="field-error">{error[0]}</p>}
    </div>
  );
}
