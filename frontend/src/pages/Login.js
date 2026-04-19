import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (role) => {
    const creds = {
      admin:   { email: 'admin@attendx.com',   password: 'admin123' },
      manager: { email: 'manager@attendx.com', password: 'manager123' },
      student: { email: 'student@attendx.com', password: 'student123' },
    };
    setForm(creds[role]);
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-box">
          <h2>Welcome back</h2>
          <p>Sign in to your AttendX account</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                className="form-control"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading} type="submit">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textAlign: 'center' }}>
              Quick demo login
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['admin','manager','student'].map(role => (
                <button key={role} className="btn btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}
                  onClick={() => demoLogin(role)}>
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
        <h3>AttendX</h3>
        <p>
          Streamlined attendance tracking and leave management for schools and organisations.
          Built for admins, managers, teachers, and students.
        </p>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['✅', 'Real-time attendance marking'],
            ['📆', 'Leave request & approval workflow'],
            ['📊', 'Insightful dashboards & reports'],
            ['🔐', 'Role-based secure access'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,.75)', fontSize: 14 }}>
              <span>{icon}</span><span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
