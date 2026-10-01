import { useEffect, useState } from "react";
import { listDoctors } from "../api/doctors";
import Pagination from "../components/Pagination";
import useDebounce from "../hooks/useDebounce";
import { friendlyMessage } from "../lib/errors";
import { Search, SlidersHorizontal, Stethoscope } from "lucide-react";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SORT_OPTIONS = [
  { value: "specialization", label: "Specialization A-Z" },
  { value: "consultation_fee", label: "Fee: low to high" },
  { value: "-consultation_fee", label: "Fee: high to low" },
];

export default function DoctorsPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput);

  // Any filter change goes back to page 1
  const [filters, setFilters] = useState({ search: "", available_on: "", sort: "specialization", page: 1 });
  const update = (changes) => setFilters((f) => ({ ...f, page: 1, ...changes }));

  useEffect(() => {
    // Debounced search is intentionally written into the request filters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    update({ search: debouncedSearch });
  }, [debouncedSearch]);

  const [result, setResult] = useState({ items: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    // The request lifecycle owns these flags so the directory reflects the active filters immediately.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    listDoctors({ ...filters, per_page: 10 })
      .then((data) => !ignore && setResult(data))
      .catch((err) => !ignore && setError(err))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [filters.search, filters.available_on, filters.sort, filters.page]);

  const { items, meta } = result;

  return (
    <div className="directory-page doctors-page page-enter">
      <div className="page-heading directory-heading"><div><p className="eyebrow">Care team</p><h1>Doctors</h1><p className="page-subtitle">Browse specialties, schedules, and consultation fees.</p></div><div className="directory-count"><Stethoscope size={17} /><strong>{meta?.total ?? "--"}</strong> active doctors</div></div>

      <div className="directory-toolbar"><div className="directory-search"><Search size={17} /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name or specialization" /></div><span className="filter-label"><SlidersHorizontal size={15} /> Filters</span>

        <select
          value={filters.available_on}
          onChange={(e) => update({ available_on: e.target.value })}
          className="directory-select"
        >
          <option value="">Any day</option>
          {WEEKDAYS.map((name, i) => (
            <option key={name} value={String(i)}>Works on {name}</option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => update({ sort: e.target.value })}
          className="directory-select"
        >
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
              <th>Doctor</th><th>Specialization</th><th>Fee</th><th>Slot</th><th>Working days</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t align-top">
                <td>
                  <div className="doctor-name"><span className="doctor-avatar">{d.name.slice(0, 1)}</span><span><strong>{d.name}</strong><small>{d.email}</small></span></div>
                </td>
                <td><span className="specialty-tag">{d.specialization}</span></td>
                {/* consultation_fee arrives as a string like "1000.00" */}
                <td className="fee-cell">Rs {Number(d.consultation_fee).toLocaleString()}</td>
                <td>{d.slot_duration} min</td>
                <td className="schedule-cell">
                  {d.schedules.map((s) => (
                    <div key={s.day_of_week}>
                      <span className="inline-block w-10 font-medium">{s.day_name.slice(0, 3)}</span>
                      {s.start_time}–{s.end_time}
                    </div>
                  ))}
                </td>
              </tr>
            ))}

            {!loading && !error && items.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">No doctors match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && items.length === 0 && <p className="loading-state"><span /> Loading doctor directory...</p>}
      </div>

      <Pagination meta={meta} loading={loading} onPage={(page) => setFilters((f) => ({ ...f, page }))} noun="doctors" />
    </div>
  );
}