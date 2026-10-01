import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NAV_ITEMS } from "../lib/navigation";
import { Activity, Bell, ChevronDown, LayoutDashboard, LogOut, Menu, Settings, UsersRound, X } from "lucide-react";
import { useState } from "react";

const ICONS = { Dashboard: LayoutDashboard, Patients: UsersRound };

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark"><Activity size={19} strokeWidth={2.5} /></span>
          <span><strong>northstar</strong><small>clinic workspace</small></span>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>

        <p className="nav-label">Workspace</p>
        <nav className="app-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `app-nav-link ${
                  isActive ? "is-active" : ""
                }`
              }
              onClick={() => setMobileOpen(false)}
            >
              {(() => { const Icon = ICONS[item.label] ?? Activity; return <Icon size={18} />; })()}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help"><Settings size={16} /><span>Workspace settings</span><ChevronDown size={14} /></div>
          <div className="profile-row">
            <div className="avatar">{user.name?.slice(0, 1).toUpperCase()}</div>
            <div className="profile-copy"><strong>{user.name}</strong><span>{user.role}</span></div>
            <button onClick={logout} className="logout-button" aria-label="Log out" title="Log out"><LogOut size={17} /></button>
          </div>
          <button onClick={logout} className="mobile-logout"><LogOut size={16} /> Log out</button>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="topbar-breadcrumb"><span>Workspace</span><span>/</span><strong>{window.location.pathname === "/patients" ? "Patients" : "Overview"}</strong></div>
          <div className="topbar-actions"><button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button><div className="topbar-status"><span /> All systems operational</div></div>
        </header>
        <main className="app-main"><Outlet /></main>
      </div>
    </div>
  );
}