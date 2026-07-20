import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../auth.jsx';
import { LoginArt } from './AuthIllustrations.jsx';
import { PersonIcon, BackIcon, MoonIcon } from '../icons.jsx';

const LockIcon = (p) => (
  <svg width={p.size || 15} height={p.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const ROLES = ['Patient', 'Doctor', 'Admin'];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('Patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(email, password, role.toLowerCase());
      navigate(homeFor(u));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shell" style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '18px 24px 0' }}>
        <MoonIcon size={18} style={{ color: 'var(--text-soft)' }} />
      </div>
      <div className="auth-page" style={{ minHeight: 'calc(100vh - 120px)', paddingTop: 0 }}>
        <div className="auth-illustration"><LoginArt /></div>
        <div className="auth-form-wrap">
          <div className="login-panel">
            <button className="icon-btn" style={{ marginBottom: 4, color: 'var(--text-faint)' }} onClick={() => navigate('/join')}>
              <BackIcon size={14} />
            </button>
            <h1 style={{ fontSize: 24 }}>
              Login As <span className="accent">{role[0]}</span>{role.slice(1)}
            </h1>
            <div style={{ height: 20 }} />
            <form onSubmit={submit}>
              <div className="grad-input">
                <PersonIcon size={15} />
                <input
                  type="email"
                  placeholder="firstname@lastname.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grad-input">
                <LockIcon size={15} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="auth-row">
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text)' }}>
                  <input type="checkbox" /> Remember me
                </label>
                <a href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
              </div>
              <button className="login-submit" disabled={busy}>{busy ? '...' : 'Submit'}</button>
              {error && <div className="auth-error">{error}</div>}
            </form>
            <div className="auth-alt">
              You Don't Have Account? <Link to="/join">Register</Link>
            </div>
          </div>
          <div className="role-switch">
            Login as:{' '}
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  background: 'none', border: 'none', padding: '2px 6px',
                  color: r === role ? 'var(--primary-bright)' : 'var(--text-soft)',
                  fontWeight: r === role ? 700 : 400,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
