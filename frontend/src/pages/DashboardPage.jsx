import { useEffect, useState } from "react";
import { getDashboard } from "../api/dashboard";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { friendlyMessage } from "../lib/errors";
import { Activity, ArrowUpRight, CalendarDays, Clock3, RefreshCw, Stethoscope, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

function StatCard({ label, value, hint, icon: Icon, tone, onClick }) {
  return (
    <button type="button" className={`admin-stat-card ${tone}`} onClick={onClick}>
      <span className="admin-stat-top"><span>{label}</span><span className="admin-stat-icon"><Icon size={17} /></span></span>
      <strong>{value}</strong>
      {hint && <span className="admin-stat-hint">{hint}</span>}
      <ArrowUpRight className="admin-stat-arrow" size={17} />
    </button>
  );
}

// Only mounted for admins, so other roles never trigger a request that would return 403
function AdminStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    getDashboard()
      .then((data) => !ignore && setStats(data))
      .catch((err) => !ignore && setError(friendlyMessage(err)));
    return () => {
      ignore = true;
    };
  }, []);

  if (error) return <div className="patients-error dashboard-alert">{error}</div>;
  if (!stats) return <div className="dashboard-loading"><span /><p>Loading clinic intelligence...</p></div>;

  const { patients, doctors, appointments, consultations } = stats;

  return (
    <div className="admin-dashboard page-enter">
      <div className="dashboard-live-line"><span><Activity size={14} /> Live clinic overview</span><small>Updated {stats.generated_at}</small></div>
      <div className="admin-stat-grid">
        <StatCard label="Patients" value={patients.total} hint={`${patients.new_this_month} new this month`} icon={UsersRound} tone="stat-blue" onClick={() => navigate("/patients")} />
        <StatCard label="Active doctors" value={doctors.active} hint="Care team members" icon={Stethoscope} tone="stat-mint" onClick={() => navigate("/doctors")} />
        <StatCard label="Appointments today" value={appointments.today} hint={`${appointments.upcoming_7_days} upcoming in 7 days`} icon={CalendarDays} tone="stat-amber" onClick={() => navigate("/appointments")} />
        <StatCard label="Consultations this month" value={consultations.this_month} hint="Completed care records" icon={Clock3} tone="stat-rose" onClick={() => navigate("/appointments")} />
      </div>

      <div className="dashboard-status-panel">
        <div className="dashboard-panel-heading"><div><p className="eyebrow">Schedule pulse</p><h2>Appointments by status</h2></div><button type="button" className="refresh-dashboard" onClick={() => window.location.reload()} title="Refresh dashboard"><RefreshCw size={16} /></button></div>
        <div className="status-filter-grid">
          <button type="button" className={`status-filter status-filter-all ${selectedStatus === "all" ? "is-selected" : ""}`} onClick={() => setSelectedStatus("all")}><span className="status-filter-label">All appointments</span><strong>{Object.values(appointments.by_status).reduce((sum, count) => sum + count, 0)}</strong></button>
          {Object.entries(appointments.by_status).map(([status, count]) => (
            <button type="button" key={status} className={`status-filter ${selectedStatus === status ? "is-selected" : ""}`} onClick={() => setSelectedStatus(status)}><StatusBadge status={status} /><strong>{count}</strong></button>
          ))}
        </div>
        <div className="status-focus"><span className="status-focus-dot" /> {selectedStatus === "all" ? "Showing your full appointment load" : `Focused on ${selectedStatus} appointments`}<button type="button" onClick={() => navigate("/appointments")}>Open schedule <ArrowUpRight size={14} /></button></div>
      </div>

      <p className="dashboard-footnote">Figures are cached and can be up to 5 minutes old.</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      <p className="text-gray-600 mt-1 mb-6">
        {user.role === "admin" ? "Clinic overview" : "Pick a section from the menu."}
      </p>
      {user.role === "admin" && <AdminStats />}
    </div>
  );
}