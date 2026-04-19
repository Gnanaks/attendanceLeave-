import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiGetUsers, apiCreateUser, apiUpdateUser, apiDeleteUser, initials } from '../utils/api';

const ROLES = ['admin','manager','teacher','employee','student'];

function UserModal({ open, user: editUser, onClose, onSaved }) {
  const defaultForm = { name:'', email:'', password:'', role:'student', department:'', employeeId:'', rollNumber:'', phone:'', isActive:true };
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(editUser ? { ...defaultForm, ...editUser, password:'' } : defaultForm);
  }, [editUser, open]);

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required');
    if (!editUser && !form.password) return toast.error('Password required for new user');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editUser) await apiUpdateUser(editUser._id, payload);
      else await apiCreateUser(payload);
      toast.success(editUser ? 'User updated!' : 'User created!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editUser ? 'Edit User' : 'Add New User'}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="form-group">
              <label>Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Role *</label>
              <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r} style={{ textTransform:'capitalize' }}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <input className="form-control" value={form.department} onChange={e => set('department', e.target.value)} placeholder="Engineering" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>{['student'].includes(form.role) ? 'Roll Number' : 'Employee ID'}</label>
              <input className="form-control"
                value={form.role === 'student' ? form.rollNumber : form.employeeId}
                onChange={e => set(form.role === 'student' ? 'rollNumber' : 'employeeId', e.target.value)}
                placeholder={form.role === 'student' ? 'R001' : 'EMP001'} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" />
            </div>
          </div>
          <div className="form-group">
            <label>{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" className="form-control" value={form.password}
              onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
          </div>
          {editUser && (
            <div className="form-group">
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:500, color:'var(--text-primary)' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                Active account
              </label>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const res = await apiGetUsers(params);
      setUsers(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await apiDeleteUser(id);
      toast.success('User deactivated');
      loadUsers();
    } catch (err) { toast.error('Failed'); }
  };

  const openCreate = () => { setEditUser(null); setModalOpen(true); };
  const openEdit = (u) => { setEditUser(u); setModalOpen(true); };

  const roleColors = { admin:'#6366f1', manager:'#10b981', teacher:'#f59e0b', employee:'#06b6d4', student:'#8b5cf6' };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center justify-between mb-6" style={{ flexWrap:'wrap', gap:12 }}>
        <div className="flex gap-2" style={{ flexWrap:'wrap' }}>
          <input className="form-control" style={{ width:220 }} placeholder="🔍  Search by name..." value={search}
            onChange={e => setSearch(e.target.value)} />
          <select className="form-control" style={{ width:150 }} value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r} style={{ textTransform:'capitalize' }}>{r}</option>)}
          </select>
        </div>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add User</button>
        )}
      </div>

      {/* Stats by role */}
      <div className="flex gap-3 mb-6" style={{ flexWrap:'wrap' }}>
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r).length;
          return (
            <div key={r} style={{
              background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8,
              padding:'8px 16px', display:'flex', alignItems:'center', gap:8
            }}>
              <span style={{ width:8,height:8,borderRadius:'50%',background:roleColors[r] || '#6366f1',display:'inline-block' }} />
              <span style={{ fontSize:13, textTransform:'capitalize', fontWeight:500 }}>{r}</span>
              <span style={{ fontWeight:800, color:roleColors[r] || '#6366f1', fontFamily:'Syne,sans-serif' }}>{count}</span>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Users</h3>
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>{users.length} total</span>
        </div>
        {loading ? <div className="loader"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>User</th><th>Role</th><th>Department</th><th>ID</th><th>Phone</th><th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr></thead>
              <tbody>
                {users.length === 0
                  ? <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-muted)', padding:32 }}>No users found</td></tr>
                  : users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar" style={{ background: roleColors[u.role] || '#6366f1', fontSize:12 }}>
                            {initials(u.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight:600 }}>{u.name}</div>
                            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: roleColors[u.role]+'18', color: roleColors[u.role] || '#6366f1', textTransform:'capitalize' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color:'var(--text-secondary)' }}>{u.department || '—'}</td>
                      <td style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'monospace' }}>
                        {u.employeeId || u.rollNumber || '—'}
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{u.phone || '—'}</td>
                      <td>
                        <span className="badge" style={{ background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#166534' : '#991b1b' }}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                            {u.isActive && (
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u._id)}>Deactivate</button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserModal open={modalOpen} user={editUser} onClose={() => setModalOpen(false)} onSaved={loadUsers} />
    </div>
  );
}
