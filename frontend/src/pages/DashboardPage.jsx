import { useAuth } from "../context/AuthContext";
import { ArrowUpRight, CalendarDays, Clock3, MoreHorizontal, Plus, UsersRound } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const WEEK_DATA = [
  { day: "Mon", visits: 38 }, { day: "Tue", visits: 52 }, { day: "Wed", visits: 45 },
  { day: "Thu", visits: 68 }, { day: "Fri", visits: 58 }, { day: "Sat", visits: 31 }, { day: "Sun", visits: 24 },
];

const APPOINTMENTS = [
  { time: "09:00", name: "Maya Rodriguez", type: "General consultation", status: "Confirmed", color: "mint" },
  { time: "10:30", name: "James Wilson", type: "Follow-up visit", status: "Waiting", color: "blue" },
  { time: "12:15", name: "Aisha Patel", type: "Routine check-up", status: "Confirmed", color: "amber" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard-page page-enter">
      <div className="page-heading">
        <div><p className="eyebrow">Thursday, October 1, 2026</p><h1>Good morning, {user.name?.split(" ")[0]} <span className="heading-dot">.</span></h1><p className="page-subtitle">Here is what is happening across your clinic today.</p></div>
        <button className="primary-button"><Plus size={18} /> New appointment</button>
      </div>

      <section className="stat-grid">
        <article className="stat-card stat-card-blue"><div className="stat-top"><span>Patients today</span><span className="stat-icon"><UsersRound size={18} /></span></div><strong>48</strong><p><span className="trend-up">+12.5%</span> vs last week</p></article>
        <article className="stat-card"><div className="stat-top"><span>Appointments</span><span className="stat-icon icon-mint"><CalendarDays size={18} /></span></div><strong>24</strong><p><span className="trend-up">+8.2%</span> vs last week</p></article>
        <article className="stat-card"><div className="stat-top"><span>Avg. wait time</span><span className="stat-icon icon-amber"><Clock3 size={18} /></span></div><strong>14 <small>min</small></strong><p><span className="trend-down">-4.3%</span> vs last week</p></article>
      </section>

      <div className="dashboard-grid">
        <section className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">Clinic activity</p><h2>Patient visits</h2></div><button className="select-button">This week <span>⌄</span></button></div><div className="chart-summary"><strong>316</strong><span><b className="trend-up">+18.4%</b> from previous week</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={WEEK_DATA}><defs><linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f6bff" stopOpacity={0.22} /><stop offset="100%" stopColor="#2f6bff" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8a94a6", fontSize: 11 }} /><Tooltip cursor={{ stroke: "#cad5e5", strokeDasharray: "4 4" }} contentStyle={{ border: "0", borderRadius: 8, boxShadow: "0 8px 24px rgba(23, 38, 65, .12)" }} /><Area type="monotone" dataKey="visits" stroke="#2f6bff" strokeWidth={3} fill="url(#visitsFill)" /></AreaChart></ResponsiveContainer></div></section>
        <section className="panel schedule-panel"><div className="panel-heading"><div><p className="eyebrow">Thursday, Oct 1</p><h2>Upcoming visits</h2></div><button className="icon-button panel-more" aria-label="More options"><MoreHorizontal size={20} /></button></div><div className="appointment-list">{APPOINTMENTS.map((appointment) => <div className="appointment-row" key={appointment.time}><span className="appointment-time">{appointment.time}</span><span className={`appointment-avatar avatar-${appointment.color}`}>{appointment.name.slice(0, 1)}</span><div className="appointment-copy"><strong>{appointment.name}</strong><span>{appointment.type}</span></div><span className={`status status-${appointment.status.toLowerCase()}`}>{appointment.status}</span></div>)}</div><button className="text-button">View full schedule <ArrowUpRight size={16} /></button></section>
      </div>
    </div>
  );
}