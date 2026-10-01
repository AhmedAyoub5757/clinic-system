import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listPatients } from "../api/patients";
import useDebounce from "../hooks/useDebounce";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, UsersRound } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// value = exactly what the API's `sort` enum accepts
const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest first" },
  { value: "created_at", label: "Oldest first" },
  { value: "last_name", label: "Last name A-Z" },
  { value: "-last_name", label: "Last name Z-A" },
  { value: "date_of_birth", label: "Oldest patients first" },
  { value: "-date_of_birth", label: "Youngest patients first" },
];

export default function PatientsPage() {
  // Filters live in the URL: refresh, back button and shared links all keep working
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const gender = params.get("gender") ?? "";
  const bloodGroup = params.get("blood_group") ?? "";
  const sort = params.get("sort") ?? "-created_at";
  const page = Number(params.get("page") ?? 1);

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput);

  const [result, setResult] = useState({ items: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Change filters in the URL. Any filter change goes back to page 1.
  function updateParams(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  }

  // Typing is debounced, then written to the URL
  useEffect(() => {
    if (debouncedSearch !== search) updateParams({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Fetch whenever the URL's filters change
  useEffect(() => {
    let ignore = false; // protects against out-of-order responses
    // The request lifecycle owns these flags so the table immediately reflects a new URL query.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    listPatients({ search, gender, blood_group: bloodGroup, sort, page, per_page: 10 })
      .then((data) => {
        if (!ignore) setResult(data);
      })
      .catch((err) => {
        if (!ignore) setError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [search, gender, bloodGroup, sort, page]);

  const { items, meta } = result;

  return (
    <div className="patients-page page-enter">
      <div className="page-heading patients-heading">
        <div><p className="eyebrow">Directory</p><h1>Patients</h1><p className="page-subtitle">Search and manage everyone in your care network.</p></div>
        <div className="patient-count"><UsersRound size={18} /><span><strong>{meta?.total ?? "--"}</strong> total patients</span></div>
      </div>

      {/* Filters */}
      <div className="patients-toolbar">
        <div className="patient-search"><Search size={17} /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name, phone or patient no." /></div>
        <div className="filter-label"><SlidersHorizontal size={15} /> Filters</div>

        <select
          value={gender}
          onChange={(e) => updateParams({ gender: e.target.value })}
          className="patient-select"
        >
          <option value="">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <select
          value={bloodGroup}
          onChange={(e) => updateParams({ blood_group: e.target.value })}
          className="patient-select"
        >
          <option value="">All blood groups</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="patient-select"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Error state: one message per documented status */}
      {error && (
        <div className="patients-error">
          {error.status === 429
            ? `Too many requests. Try again in ${error.retryAfter ?? 60} seconds.`
            : error.message}
        </div>
      )}

      {/* Table. While reloading, the old rows stay visible but dimmed. */}
      <div className={`patients-table-wrap ${loading ? "is-loading" : ""}`}>
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient no.</th><th>Name</th><th>Gender</th><th>Age</th><th>Phone</th><th>Blood</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="patient-number">{p.patient_number}</td><td className="patient-name">{p.full_name}</td><td className="capitalize">{p.gender}</td><td>{p.age}</td><td>{p.phone}</td><td><span className="blood-tag">{p.blood_group ?? "—"}</span></td>
              </tr>
            ))}

            {/* Empty state */}
            {!loading && !error && items.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  No patients match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* First load state */}
        {loading && items.length === 0 && (
          <p className="loading-state"><span /> Loading patient records...</p>
        )}
      </div>

      {/* Pagination, driven entirely by `meta` */}
      {meta && meta.total > 0 && (
        <div className="patients-pagination">
          <span>
            Page {meta.current_page} of {meta.last_page} · {meta.total} patients
          </span>
          <div className="pagination-actions">
            <button
              disabled={meta.current_page <= 1 || loading}
              onClick={() => updateParams({ page: String(meta.current_page - 1) })}
              className="pagination-button"
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <button
              disabled={meta.current_page >= meta.last_page || loading}
              onClick={() => updateParams({ page: String(meta.current_page + 1) })}
              className="pagination-button"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}