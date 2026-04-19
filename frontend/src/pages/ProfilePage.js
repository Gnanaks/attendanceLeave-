import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiUpdateUser, apiChangePassword, initials } from '../utils/api';

export default function ProfilePage() {
  const { user, fetchMe } = useAuth();
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', department: user.department || '' });
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await apiUpdateUser(user._id, form);
      await fetchMe();
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await apiChangePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const roleColors = { admin:'#6366f1', manager:'#10b981', teacher:'#f59e0b', employee:'#06b6d4', student:'#8b5cf6' };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Profile header */}
      <div className="card mb-6">
        <div className="card-body" style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div className="avatar lg" style={{ background: roleColors[user.role] || '#6366f1' }}>
            {initials(user.name)}
          </div>
          <div>
            <h2 style={{ fontSize:22, fontWeight:800 }}>{user.name}</h2>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
              <span className="badge" style={{ background: roleColors[user.role]+'18', color: roleColors[user.role], textTransform:'capitalize' }}>
                {user.role}
              </span>
              {user.department && (
                <span className="badge" style={{ background:'var(--surface-2)', color:'var(--text-secondary)' }}>
                  {user.department}
                </span>
              )}
              {(user.employeeId || user.rollNumber) && (
                <span className="badge" style={{ background:'var(--surface-2)', color:'var(--text-muted)', fontFamily:'monospace' }}>
                  {user.employeeId || user.rollNumber}
                </span>
              )}
            </div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:6 }}>{user.email}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Profile Info</button>
        <button className={`tab ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>Security</button>
      </div>

      {tab === 'info' && (
        <div className="card">
          <div className="card-header"><h3>Edit Profile</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" value={user.email} disabled style={{ background:'var(--surface-2)', cursor:'not-allowed' }} />
              <small style={{ color:'var(--text-muted)', fontSize:11 }}>Email cannot be changed</small>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input className="form-control" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Engineering" />
            </div>
            <div className="form-group">
              <label>Member Since</label>
              <input className="form-control" value={new Date(user.createdAt || user.joinDate).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}
                disabled style={{ background:'var(--surface-2)', cursor:'not-allowed' }} />
            </div>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <div className="card-header"><h3>Change Password</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" className="form-control" value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" className="form-control" value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" className="form-control" value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Re-enter new password" />
            </div>
            {pwForm.newPassword && pwForm.confirm && pwForm.newPassword !== pwForm.confirm && (
              <div style={{ color:'var(--danger)', fontSize:13, marginBottom:12 }}>⚠ Passwords do not match</div>
            )}
            <button className="btn btn-primary" onClick={handlePasswordChange} disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>

            <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid var(--border)' }}>
              <h4 style={{ marginBottom:10, fontSize:14 }}>Account Info</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  ['Role',   user.role],
                  ['Status', user.isActive ? 'Active' : 'Inactive'],
                  ['ID',     user.employeeId || user.rollNumber || 'Not set'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:'var(--text-secondary)' }}>{k}</span>
                    <span style={{ fontWeight:600, textTransform:'capitalize' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
