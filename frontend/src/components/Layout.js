import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/api';

const Icons = {
  dashboard: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  attendance: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  leaves: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  users: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  profile: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  logout: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,
  menu: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>,
};

const pageTitles = { '/dashboard': 'Dashboard', '/attendance': 'Attendance', '/leaves': 'Leave Management', '/users': 'User Management', '/profile': 'My Profile' };

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const currentTitle = pageTitles[window.location.pathname] || 'AttendX';

  const navLinks = [
    { to: '/dashboard',  label: 'Dashboard',  icon: Icons.dashboard,  show: true },
    { to: '/attendance', label: 'Attendance',  icon: Icons.attendance, show: true },
    { to: '/leaves',     label: 'Leaves',      icon: Icons.leaves,     show: true },
    { to: '/users',      label: 'Users',       icon: Icons.users,      show: hasRole('admin','manager','teacher') },
    { to: '/profile',    label: 'Profile',     icon: Icons.profile,    show: true },
  ];

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:99 }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>Attend<span>X</span></h2>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2, textTransform: 'capitalize' }}>
            {user?.role} Portal
          </div>
        </div>

        <nav className="sidebar-nav">
          {navLinks.filter(l => l.show).map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{initials(user?.name)}</div>
          <div className="sidebar-user-info">
            <strong>{user?.name}</strong>
            <small>{user?.role} · {user?.department || 'No dept'}</small>
          </div>
          <button className="nav-item" style={{ padding: 8, marginBottom: 0, width: 'auto' }} onClick={handleLogout} title="Logout">
            {Icons.logout}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-sm" style={{ display: 'none' }}
              onClick={() => setSidebarOpen(true)}>
              {Icons.menu}
            </button>
            <h1>{currentTitle}</h1>
          </div>
          <div className="topbar-actions">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
            </span>
          </div>
        </header>

        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
