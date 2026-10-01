import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { deletePatient, listPatients } from "../api/patients";
import { useAuth } from "../context/AuthContext";
import useDebounce from "../hooks/useDebounce";
import { AlertTriangle, ChevronLeft, ChevronRight, Edit3, Plus, Search, SlidersHorizontal, Trash2, UsersRound, X } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest first" },
  { value: "created_at", label: "Oldest first" },
  { value: "last_name", label: "Last name A-Z" },
  { value: "-last_name", label: "Last name Z-A" },
  { value: "date_of_birth", label: "Oldest patients first" },
  { value: "-date_of_birth", label: "Youngest patients first" },
];

export default function PatientsPage() {
  const { user } = useAuth();
  const canWrite = user.role === "receptionist"; // Swagger: writes are receptionist-only
  const isDoctor = user.role === "doctor";

  const location = useLocation();
  const navigate = useNavigate();
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
  const [reloadKey, setReloadKey] = useState(0); // bump to refetch the same filters

  // Success message passed from the form page, then removed from history state
  const [flash, setFlash] = useState(location.state?.flash ?? "");
  useEffect(() => {
    if (location.state?.flash) {
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Delete confirmation
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function updateParams(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  }

  useEffect(() => {
    if (debouncedSearch !== search) updateParams({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    let ignore = false;
    // The request lifecycle owns these flags so the table immediately reflects new filters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    listPatients({ search, gender, blood_group: bloodGroup, sort, page, per_page: 10 })
      .then((data) => !ignore && setResult(data))
      .catch((err) => !ignore && setError(err))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [search, gender, bloodGroup, sort, page, reloadKey]);

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError("");

    try {
      await deletePatient(toDelete.id);
      setFlash(`${toDelete.full_name} deleted`);
      setToDelete(null);

      // If that was the last row on this page, step back one page
      if (result.items.length === 1 && page > 1) updateParams({ page: String(page - 1) });
      else setReloadKey((k) => k + 1);
    } catch (err) {
      if (err.status === 404) {
        // Someone else already deleted it: the goal is achieved, just refresh
        setToDelete(null);
        setFlash("That patient was already deleted.");
        setReloadKey((k) => k + 1);
      } else if (err.status === 429) {
        setDeleteError(`Too many requests. Try again in ${err.retryAfter ?? 60} seconds.`);
      } else {
        setDeleteError(err.message); // 403, network error
      }
    } finally {
      setDeleting(false);
    }
  }

  const { items, meta } = result;

  return (
    <div className="patients-page page-enter">
      <div className="page-heading patients-heading">
        <div><p className="eyebrow">Directory</p><h1>Patients</h1><p className="page-subtitle">Search and manage everyone in your care network.</p></div>
        <div className="patient-heading-actions">
          <div className="patient-count"><UsersRound size={17} /><span><strong>{meta?.total ?? "--"}</strong> total patients</span></div>
        {canWrite && (
          <Link to="/patients/new" className="primary-button">
            <Plus size={17} /> New patient
          </Link>
        )}
        </div>
      </div>

      {flash && (
        <div className="patient-flash" role="status">
          <span>{flash}</span><button onClick={() => setFlash("")} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="patients-toolbar">
        <div className="patient-search"><Search size={17} /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name, phone or patient no." /></div>
        <div className="filter-label"><SlidersHorizontal size={15} /> Filters</div>

        <select value={gender} onChange={(e) => updateParams({ gender: e.target.value })} className="patient-select">
          <option value="">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <select value={bloodGroup} onChange={(e) => updateParams({ blood_group: e.target.value })} className="patient-select">
          <option value="">All blood groups</option>
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })} className="patient-select">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="patients-error">
          {error.status === 429
            ? `Too many requests. Try again in ${error.retryAfter ?? 60} seconds.`
            : error.message}
        </div>
      )}

      <div className={`patients-table-wrap ${loading ? "is-loading" : ""}`}>
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient no.</th><th>Name</th><th>Gender</th><th>Age</th><th>Phone</th><th>Blood</th>{canWrite && <th className="actions-heading">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="patient-number">{p.patient_number}</td><td className="patient-name">{isDoctor ? (<Link to={`/patients/${p.id}/history`} className="text-blue-600">{p.full_name}</Link>) : (p.full_name)}</td><td className="capitalize">{p.gender}</td><td>{p.age}</td><td>{p.phone}</td><td><span className="blood-tag">{p.blood_group ?? "—"}</span></td>
                {canWrite && (
                  <td className="patient-actions">
                    <Link to={`/patients/${p.id}/edit`} className="table-action edit-action"><Edit3 size={14} /> Edit</Link>
                    <button
                      onClick={() => {
                        setDeleteError("");
                        setToDelete(p);
                      }}
                      className="table-action delete-action"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {!loading && !error && items.length === 0 && (
              <tr>
                <td colSpan={canWrite ? 7 : 6} className="empty-state">
                  No patients match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {loading && items.length === 0 && <p className="loading-state"><span /> Loading patient records...</p>}
      </div>

      {meta && meta.total > 0 && (
        <div className="patients-pagination">
          <span>Page {meta.current_page} of {meta.last_page} · {meta.total} patients</span>
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

      {/* Delete confirmation */}
      {toDelete && (
        <div className="delete-overlay" onMouseDown={(e) => e.target === e.currentTarget && !deleting && setToDelete(null)}>
          <div className="delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="delete-icon"><AlertTriangle size={21} /></div><h2 id="delete-title">Delete patient?</h2>
            <p>
              <span className="font-medium">{toDelete.full_name}</span> ({toDelete.patient_number}) will be removed
              from the list. Their existing appointments keep showing their name.
            </p>

            {deleteError && <div className="patients-error">{deleteError}</div>}

            <div className="delete-actions">
              <button onClick={() => setToDelete(null)} disabled={deleting} className="secondary-button">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="danger-button"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}