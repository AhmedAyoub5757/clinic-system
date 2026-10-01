import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDoctors } from "../api/doctors";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/AuthContext";
import useDebounce from "../hooks/useDebounce";
import useFlash from "../hooks/useFlash";
import { friendlyMessage } from "../lib/errors";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SORT_OPTIONS = [
  { value: "specialization", label: "Specialization A-Z" },
  { value: "consultation_fee", label: "Fee: low to high" },
  { value: "-consultation_fee", label: "Fee: high to low" },
];

export default function DoctorsPage() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin"; // Swagger: writes are admin-only
  const [flash, setFlash] = useFlash();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput);

  // is_active: the API sends "1" for active (its default) or "0" for inactive. There is no "all".
  const [filters, setFilters] = useState({ search: "", available_on: "", is_active: "1", sort: "specialization", page: 1 });
  const update = (changes) => setFilters((f) => ({ ...f, page: 1, ...changes }));

  useEffect(() => {
    update({ search: debouncedSearch });
  }, [debouncedSearch]);

  const [result, setResult] = useState({ items: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    listDoctors({ ...filters, per_page: 10 })
      .then((data) => !ignore && setResult(data))
      .catch((err) => !ignore && setError(err))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [filters.search, filters.available_on, filters.is_active, filters.sort, filters.page]);

  const { items, meta } = result;
  const columns = isAdmin ? 6 : 5;

  return (
    <div className="directory-page doctors-page page-enter">
      <div className="page-heading directory-heading">
        <div>
          <p className="eyebrow">Clinical directory</p>
          <h1>Doctors</h1>
          <p className="page-subtitle">Keep profiles, availability, and fees in view.</p>
        </div>
        {isAdmin && (
          <Link to="/doctors/new" className="primary-button">New doctor profile</Link>
        )}
      </div>

      {flash && (
        <div className="patient-flash">
          <span>{flash}</span>
          <button onClick={() => setFlash("")} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="directory-toolbar doctors-toolbar">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Name or specialization"
          className="directory-search-input"
        />

        <select value={filters.available_on} onChange={(e) => update({ available_on: e.target.value })} className="directory-select">
          <option value="">Any day</option>
          {WEEKDAYS.map((name, i) => (
            <option key={name} value={String(i)}>Works on {name}</option>
          ))}
        </select>

        {isAdmin && (
          <select value={filters.is_active} onChange={(e) => update({ is_active: e.target.value })} className="directory-select">
            <option value="1">Active doctors</option>
            <option value="0">Inactive doctors</option>
          </select>
        )}

        <select value={filters.sort} onChange={(e) => update({ sort: e.target.value })} className="directory-select">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && <div className="patients-error">{friendlyMessage(error)}</div>}

      <div className={`directory-table-wrap ${loading ? "is-loading" : ""}`}>
        <table className="directory-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Specialization</th>
              <th>Fee</th>
              <th>Slot</th>
              <th>Working days</th>
              {isAdmin && <th className="actions-heading">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="record-name">{d.name}</div>
                  <div className="record-meta">{d.email}</div>
                </td>
                <td>{d.specialization}</td>
                <td>Rs {Number(d.consultation_fee).toLocaleString()}</td>
                <td>{d.slot_duration} min</td>
                <td className="schedule-cell">
                  {d.schedules.map((s) => (
                    <div key={s.day_of_week}>
                      <span>{s.day_name.slice(0, 3)}</span>
                      {s.start_time}–{s.end_time}
                    </div>
                  ))}
                </td>
                {isAdmin && (
                  <td className="patient-actions">
                    <Link to={`/doctors/${d.id}/edit`} className="table-action edit-action">Edit</Link>
                  </td>
                )}
              </tr>
            ))}

            {!loading && !error && items.length === 0 && (
              <tr><td colSpan={columns} className="empty-state">No doctors match these filters.</td></tr>
            )}
          </tbody>
        </table>
        {loading && items.length === 0 && <p className="loading-state"><span /> Loading doctors...</p>}
      </div>

      <Pagination meta={meta} loading={loading} onPage={(page) => setFilters((f) => ({ ...f, page }))} noun="doctors" />
    </div>
  );
}