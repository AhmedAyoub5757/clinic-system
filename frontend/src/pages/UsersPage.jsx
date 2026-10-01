import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteUser, listUsers } from "../api/users";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/AuthContext";
import useDebounce from "../hooks/useDebounce";
import useFlash from "../hooks/useFlash";
import { friendlyMessage } from "../lib/errors";

const ROLES = ["admin", "doctor", "receptionist"];

const ROLE_STYLES = {
  admin: "bg-purple-100 text-purple-800",
  doctor: "bg-blue-100 text-blue-800",
  receptionist: "bg-teal-100 text-teal-800",
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const [flash, setFlash] = useFlash();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput);
  const [filters, setFilters] = useState({ search: "", role: "", page: 1 });
  const update = (changes) => setFilters((f) => ({ ...f, page: 1, ...changes }));

  useEffect(() => {
    update({ search: debouncedSearch });
  }, [debouncedSearch]);

  const [result, setResult] = useState({ items: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    listUsers({ ...filters, per_page: 10 })
      .then((data) => !ignore && setResult(data))
      .catch((err) => !ignore && setError(err))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [filters.search, filters.role, filters.page, reloadKey]);

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError("");

    try {
      await deleteUser(toDelete.id);
      setFlash(`${toDelete.name} deleted`);
      setToDelete(null);

      if (result.items.length === 1 && filters.page > 1) setFilters((f) => ({ ...f, page: f.page - 1 }));
      else setReloadKey((k) => k + 1);
    } catch (err) {
      if (err.status === 404) {
        setToDelete(null);
        setFlash("That user was already deleted.");
        setReloadKey((k) => k + 1);
      } else {
        // 409 "has related records" lands here and is shown inside the modal
        setDeleteError(friendlyMessage(err));
      }
    } finally {
      setDeleting(false);
    }
  }

  const { items, meta } = result;

  return (
    <div className="directory-page staff-page page-enter">
      <div className="page-heading directory-heading">
        <div>
          <p className="eyebrow">Workspace access</p>
          <h1>Staff</h1>
          <p className="page-subtitle">Manage the people who keep the clinic moving.</p>
        </div>
        <Link to="/users/new" className="primary-button">New user</Link>
      </div>

      {flash && (
        <div className="patient-flash">
          <span>{flash}</span>
          <button onClick={() => setFlash("")} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="directory-toolbar staff-toolbar">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Name or email"
          className="directory-search-input"
        />
        <select value={filters.role} onChange={(e) => update({ role: e.target.value })} className="directory-select">
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r} className="capitalize">{r}</option>
          ))}
        </select>
      </div>

      {error && <div className="patients-error">{friendlyMessage(error)}</div>}

      <div className={`directory-table-wrap ${loading ? "is-loading" : ""}`}>
        <table className="directory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th className="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => {
              const isSelf = u.id === me.id;
              return (
                <tr key={u.id}>
                  <td>
                    {u.name} {isSelf && <span className="text-xs text-gray-400">(you)</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-pill ${ROLE_STYLES[u.role] ?? ""}`}>{u.role}</span>
                  </td>
                  <td className="patient-actions">
                    <Link to={`/users/${u.id}/edit`} className="text-blue-600">Edit</Link>
                    {/* The API returns 403 for deleting yourself, so don't offer it */}
                    {!isSelf && (
                      <button onClick={() => { setDeleteError(""); setToDelete(u); }} className="text-red-600">Delete</button>
                    )}
                  </td>
                </tr>
              );
            })}

            {!loading && !error && items.length === 0 && (
              <tr><td colSpan={4} className="empty-state">No users match these filters.</td></tr>
            )}
          </tbody>
        </table>
        {loading && items.length === 0 && <p className="loading-state"><span /> Loading staff...</p>}
      </div>

      <Pagination meta={meta} loading={loading} onPage={(page) => setFilters((f) => ({ ...f, page }))} noun="users" />

      {toDelete && (
        <div className="delete-overlay">
          <div className="delete-dialog">
            <div className="delete-icon">!</div>
            <h2>Delete user?</h2>
            <p>
              <span className="font-medium">{toDelete.name}</span> ({toDelete.email}) will lose access immediately.
              Users with appointments or consultations can't be deleted.
            </p>
            {deleteError && <div className="patients-error">{deleteError}</div>}
            <div className="delete-actions">
              <button onClick={() => setToDelete(null)} disabled={deleting} className="secondary-button">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="danger-button">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}