import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiGetAttendance, apiMarkAttendance, apiGetSummary, apiGetUsers, statusColors, fmtDate } from '../utils/api';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const STATUSES = ['present','absent','late','half-day','on-leave','holiday'];

function Badge({ status }) {
  const c = statusColors[status] || { bg: '#f1f5f9', text: '#475569' };
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{status}</span>;
}

function CheckInModal({ open, onClose, onSave, existing }) {
  const [form, setForm] = useState({ status: 'present', checkIn: '09:00', checkOut: '17:00', notes: '' });
  useEffect(() => { if (existing) setForm({ ...form, ...existing }); }, [existing]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Mark My Attendance</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Check In</label>
              <input type="time" className="form-control" value={form.checkIn}
                onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Check Out</label>
              <input type="time" className="form-control" value={form.checkOut}
                onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input className="form-control" placeholder="Optional note..." value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onSave(form); onClose(); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function BulkMarkModal({ open, onClose, users, onSave }) {
  const today = fmtDate(new Date());
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState({});

  useEffect(() => {
    if (users.length) {
      const r = {};
      users.forEach(u => { r[u._id] = 'present'; });
      setRecords(r);
    }
  }, [users]);

  if (!open) return null;

  const setAll = (status) => {
    const r = {};
    users.forEach(u => { r[u._id] = status; });
    setRecords(r);
  };

  const handleSave = () => {
    const payload = Object.entries(records).map(([userId, status]) => ({ userId, date, status }));
    onSave(payload);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Bulk Mark Attendance</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Date</label>
            <input type="date" className="form-control" value={date} max={today}
              onChange={e => setDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginRight: 4, alignSelf: 'center' }}>Mark all:</span>
            {['present','absent','late'].map(s => (
              <button key={s} className="btn btn-secondary btn-sm" style={{ textTransform: 'capitalize' }}
                onClick={() => setAll(s)}>{s}</button>
            ))}
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {users.map(u => (
              <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
                <select className="form-control" style={{ width: 140 }} value={records[u._id] || 'present'}
                  onChange={e => setRecords(r => ({ ...r, [u._id]: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save All</button>
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { user, hasRole } = useAuth();
  const isManager = hasRole('admin','manager','teacher');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(user._id);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [tab, setTab] = useState('calendar');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes] = await Promise.all([
        apiGetSummary(selectedUser, { month, year }),
      ]);
      setSummary(sumRes.data.data.summary);
      setRecords(sumRes.data.data.records);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedUser, month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (isManager) {
      apiGetUsers({ limit: 100 }).then(r => setUsers(r.data.data)).catch(() => {});
    }
  }, [isManager]);

  const todayRecord = records.find(r => fmtDate(r.date) === fmtDate(new Date()));

  const handleCheckIn = async (form) => {
    try {
      await apiMarkAttendance({ userId: user._id, date: fmtDate(new Date()), ...form });
      toast.success('Attendance marked!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleBulkSave = async (payload) => {
    try {
      await apiMarkAttendance({ records: payload });
      toast.success(`${payload.length} records saved!`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  // Build calendar
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const calCells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );
  const recordMap = {};
  records.forEach(r => {
    const d = new Date(r.date).getDate();
    recordMap[d] = r.status;
  });

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => {
    const n = new Date(); if (year > n.getFullYear() || (year === n.getFullYear() && month >= n.getMonth() + 1)) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="tabs" style={{ flex: 1, maxWidth: 300 }}>
          <button className={`tab ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>Calendar</button>
          <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>Records</button>
        </div>
        <div className="flex gap-2">
          {!isManager && (
            <button className="btn btn-primary btn-sm" onClick={() => setCheckInOpen(true)}>
              + Mark Today
            </button>
          )}
          {isManager && (
            <button className="btn btn-primary btn-sm" onClick={() => setBulkOpen(true)}>
              + Bulk Mark
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isManager ? '220px 1fr' : '1fr', gap: 16 }}>
        {/* User selector for managers */}
        {isManager && (
          <div className="card" style={{ padding: 16, alignSelf: 'start' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Select User</div>
            <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {users.map(u => (
                <button key={u._id} onClick={() => setSelectedUser(u._id)}
                  style={{
                    padding: '8px 10px', borderRadius: 7, border: 'none', textAlign: 'left',
                    background: selectedUser === u._id ? 'var(--accent-bg)' : 'transparent',
                    color: selectedUser === u._id ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: selectedUser === u._id ? 700 : 400,
                    cursor: 'pointer', fontSize: 13,
                  }}>
                  {u.name}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, textTransform: 'capitalize' }}>{u.role}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          {/* Summary strip */}
          {summary && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Present',  val: summary.present,  color: '#10b981' },
                { label: 'Absent',   val: summary.absent,   color: '#ef4444' },
                { label: 'Late',     val: summary.late,     color: '#f59e0b' },
                { label: 'On Leave', val: summary.onLeave,  color: '#8b5cf6' },
                { label: 'Hours',    val: `${summary.totalHours}h`, color: '#6366f1' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: s.color, fontFamily: 'Syne,sans-serif' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Calendar view */}
          {tab === 'calendar' && (
            <div className="card">
              <div className="card-header">
                <button className="btn btn-secondary btn-sm" onClick={prevMonth}>‹</button>
                <h3 style={{ textAlign: 'center' }}>
                  {new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={nextMonth}>›</button>
              </div>
              <div className="card-body">
                <div className="calendar-grid">
                  {DAYS.map(d => <div key={d} className="cal-header">{d}</div>)}
                  {calCells.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} className="cal-day empty" />;
                    const status = recordMap[day];
                    const c = status ? statusColors[status] : {};
                    const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
                    return (
                      <div key={day} className={`cal-day ${isToday ? 'today' : ''}`}
                        style={{ background: c.bg || 'var(--surface-2)', color: c.text || 'var(--text-muted)', border: isToday ? '2px solid var(--accent)' : '1px solid transparent' }}
                        title={status || ''}>
                        <span style={{ fontWeight: isToday ? 800 : 400 }}>{day}</span>
                        {status && <span style={{ fontSize: 9, marginTop: 2, textTransform: 'uppercase', letterSpacing: .3 }}>{status.slice(0,3)}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* List view */}
          {tab === 'list' && (
            <div className="card">
              <div className="card-header">
                <h3>Attendance Records</h3>
                <div className="flex gap-2">
                  <select className="form-control btn-sm" style={{ width: 100 }} value={month} onChange={e => setMonth(Number(e.target.value))}>
                    {Array.from({length:12},(_,i) => <option key={i+1} value={i+1}>{new Date(2000,i).toLocaleString('default',{month:'short'})}</option>)}
                  </select>
                  <input type="number" className="form-control btn-sm" style={{ width: 75 }} value={year}
                    onChange={e => setYear(Number(e.target.value))} min={2020} max={now.getFullYear()} />
                </div>
              </div>
              {loading ? <div className="loader"><div className="spinner" /></div> : (
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Notes</th>
                    </tr></thead>
                    <tbody>
                      {records.length === 0
                        ? <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-muted)', padding:32 }}>No records found</td></tr>
                        : records.sort((a,b) => new Date(b.date)-new Date(a.date)).map(r => (
                          <tr key={r._id}>
                            <td>{new Date(r.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</td>
                            <td><Badge status={r.status} /></td>
                            <td>{r.checkIn || '—'}</td>
                            <td>{r.checkOut || '—'}</td>
                            <td>{r.workingHours ? `${r.workingHours}h` : '—'}</td>
                            <td style={{ color:'var(--text-muted)' }}>{r.notes || '—'}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)}
        onSave={handleCheckIn} existing={todayRecord} />
      <BulkMarkModal open={bulkOpen} onClose={() => setBulkOpen(false)}
        users={users} onSave={handleBulkSave} />
    </div>
  );
}
