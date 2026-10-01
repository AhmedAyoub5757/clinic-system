import { useEffect, useState } from "react";
import { getDashboard } from "../api/dashboard";
import { listAppointments } from "../api/appointments";
import { listDoctors } from "../api/doctors";
import { listPatients } from "../api/patients";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { todayString } from "../lib/dates";
import { friendlyMessage } from "../lib/errors";
import { Activity, ArrowUpRight, CalendarDays, Clock3, RefreshCw, Stethoscope, UsersRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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

function StaffDashboard({ role }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const isDoctor = role === "doctor";
  const today = todayString();

  useEffect(() => {
    let ignore = false;
    setData(null);
    setError("");

    Promise.all([
      listAppointments({ date: today, sort: "appointment_date", per_page: 10 }),
      listPatients({ per_page: 1 }),
      listDoctors({ per_page: 1 }),
    ])
      .then(([appointments, patients, doctors]) => {
        if (!ignore) setData({ appointments, patients, doctors });
      })
      .catch((err) => !ignore && setError(friendlyMessage(err)));

    return () => {
      ignore = true;
    };
  }, [today, refreshKey]);

  if (error) return <div className="patients-error dashboard-alert">{error}</div>;
  if (!data) return <div className="dashboard-loading"><span /><p>Loading today&apos;s clinic view...</p></div>;

  const appointments = data.appointments.items;
  const pending = appointments.filter((appointment) => appointment.status === "pending").length;
  const confirmed = appointments.filter((appointment) => appointment.status === "confirmed").length;
  const completed = appointments.filter((appointment) => appointment.status === "completed").length;
  const title = isDoctor ? "Your clinic day" : "Front desk overview";
  const subtitle = isDoctor ? "Your appointments and care tasks for today." : "Keep today’s arrivals, bookings, and care team moving.";

  return (
    <div className="staff-dashboard page-enter">
      <div className="dashboard-live-line"><span><Activity size={14} /> {isDoctor ? "Doctor workspace" : "Reception workspace"}</span><small>{today} · live data</small></div>
      <div className="staff-dashboard-heading"><div><p className="eyebrow">{isDoctor ? "Daily rounds" : "Daily operations"}</p><h2>{title}</h2><p>{subtitle}</p></div><button type="button" className="refresh-dashboard" onClick={() => setRefreshKey((key) => key + 1)} title="Refresh dashboard"><RefreshCw size={17} /></button></div>
      <div className="staff-stat-grid">
        <Link to="/appointments" className="staff-stat-card"><span><CalendarDays size={17} /> Today&apos;s appointments</span><strong>{data.appointments.meta?.total ?? appointments.length}</strong><small>{confirmed} confirmed · {pending} pending</small></Link>
        <Link to="/patients" className="staff-stat-card"><span><UsersRound size={17} /> Patient directory</span><strong>{data.patients.meta?.total ?? "--"}</strong><small>Current patient records</small></Link>
        <Link to="/doctors" className="staff-stat-card"><span><Stethoscope size={17} /> Active doctors</span><strong>{data.doctors.meta?.total ?? "--"}</strong><small>Available care team</small></Link>
        <div className="staff-stat-card staff-stat-muted"><span><Clock3 size={17} /> Completed today</span><strong>{completed}</strong><small>{isDoctor ? "Your completed consultations" : "Completed appointments"}</small></div>
      </div>
      <div className="staff-content-grid">
        <section className="staff-panel"><div className="dashboard-panel-heading"><div><p className="eyebrow">Today&apos;s schedule</p><h2>{appointments.length ? "Upcoming appointments" : "No appointments yet"}</h2></div><Link to="/appointments" className="text-button">Open schedule <ArrowUpRight size={14} /></Link></div>{appointments.length === 0 ? <p className="staff-empty">Your live appointment list is clear for today.</p> : <div className="staff-appointment-list">{appointments.slice(0, 6).map((appointment) => <div className="staff-appointment" key={appointment.id}><span className="staff-time">{appointment.start_time}</span><div><strong>{appointment.patient?.full_name ?? "Patient"}</strong><small>{appointment.doctor?.name ?? "Assigned doctor"}</small></div><StatusBadge status={appointment.status} />{isDoctor && appointment.status === "confirmed" && appointment.appointment_date <= today && <Link to={`/appointments/${appointment.id}/consultation/new`} className="staff-action">Record</Link>}</div>)}</div>}</section>
        <section className="staff-panel staff-next-panel"><p className="eyebrow">Next best action</p><h2>{isDoctor ? "Complete today&apos;s care records" : "Prepare the next arrival"}</h2><p>{isDoctor ? "Open a confirmed appointment to record symptoms, diagnosis, and prescriptions." : "Search for a patient, book a visit, or review today&apos;s appointment queue."}</p><Link to={isDoctor ? "/appointments" : "/appointments/new"} className="primary-button">{isDoctor ? "View my appointments" : "Book appointment"} <ArrowUpRight size={16} /></Link></section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard-page page-enter">
      <div className="page-heading"><div><p className="eyebrow">Thursday, October 1, 2026</p><h1>Good morning, {user.name?.split(" ")[0]} <span className="heading-dot">.</span></h1><p className="page-subtitle">{user.role === "admin" ? "Here is what is happening across your clinic today." : "Your workspace, focused on what needs attention today."}</p></div></div>
      {user.role === "admin" ? <AdminStats /> : <StaffDashboard role={user.role} />}
    </div>
  );
}