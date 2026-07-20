import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, homeFor } from '../auth.jsx';
import { SignupArt } from './AuthIllustrations.jsx';
import { MoonIcon } from '../icons.jsx';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get('role') === 'doctor' ? 'doctor' : 'patient';
  const [form, setForm] = useState({ firstName: '', lastName: '', gender: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await register({ ...form, role });
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
        <div className="auth-illustration"><SignupArt /></div>
        <div className="auth-form-wrap">
          <h1>Sign up</h1>
          <div className="auth-sub">Hi there welcome to our family ✌️</div>
          <form onSubmit={submit}>
            <div className="form-grid-2">
              <div className="field">
                <label>First Name *</label>
                <input value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div className="field">
                <label>Last Name *</label>
                <input value={form.lastName} onChange={set('lastName')} required />
              </div>
            </div>
            <div className="field">
              <label>Gender *</label>
              <select value={form.gender} onChange={set('gender')} required>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="field">
              <label>Email address *</label>
              <input type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="field">
              <label>Password *</label>
              <input type="password" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <button className="auth-submit" style={{ background: '#57d68d' }} disabled={busy}>
              {busy ? '...' : 'Sign up'}
            </button>
            {error && <div className="auth-error">{error}</div>}
          </form>
          <div className="auth-alt">Already a user? <Link to="/login">Login</Link></div>
        </div>
      </div>
    </div>
  );
}
