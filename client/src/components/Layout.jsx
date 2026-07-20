import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo.jsx';
import Avatar from './Avatar.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useAuth } from '../auth.jsx';
import { Toasts } from '../toast.jsx';

export default function Layout({ nav, settingsPath, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo"><Logo /></div>
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </aside>
      <div className="main">
        <header className="topbar">
          <ThemeToggle />
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button className="avatar-btn" onClick={() => setMenuOpen((o) => !o)}>
              <Avatar user={user} size={32} />
            </button>
            {menuOpen && (
              <div className="dropdown-menu" style={{ right: 0 }}>
                <div style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}>
                  {user?.first_name} {user?.last_name}
                  <div style={{ fontWeight: 400, color: 'var(--text-faint)', fontSize: 11.5 }}>{user?.email}</div>
                </div>
                {settingsPath && (
                  <button className="item" onClick={() => { setMenuOpen(false); navigate(settingsPath); }}>
                    Manage Profile
                  </button>
                )}
                <button className="item" style={{ color: 'var(--danger)' }} onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        </header>
        <div className="content">{children}</div>
        <footer className="app-footer"><Logo size={44} /></footer>
      </div>
      <Toasts />
    </div>
  );
}

export function Breadcrumbs({ page, root = 'Menu' }) {
  return (
    <div className="breadcrumbs">
      <span>{root}</span> <span className="sep">›</span> <span className="current">{page}</span>
    </div>
  );
}
