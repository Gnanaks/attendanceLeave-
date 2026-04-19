import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiGetLeaves, apiApplyLeave, apiReviewLeave, apiCancelLeave, statusColors } from '../utils/api';

const LEAVE_TYPES = ['sick','casual','earned','maternity','paternity','unpaid','other'];

function Badge({ status }) {
  const c = statusColors[status] || { bg: '#f1f5f9', text: '#475569' };
  return <span className="badge" style={{ background: c.bg, color: c.text }}>{status}</span>;
}

function ApplyModal({ open, onClose, onApplied }) {
  const [form, setForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const calcDays = () => {
    if (!form.startDate || !form.endDate) return 0;
    let count = 0;
    const cur = new Date(form.startDate);
    const end = new Date(form.endDate);
    while (cur <= end) { if (cur.getDay() !== 0) count++; cur.setDate(cur.getDate()+1); }
    return count;
  };

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate || !form.reason) return toast.error('Fill all fields');
    if (new Date(form.endDate) < new Date(form.startDate)) return toast.error('End date must be after start');
    setLoading(true);
    try {
      await apiApplyLeave(form);
      toast.success('Leave application submitted!');
      onApplied();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Apply for Leave</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Leave Type</label>
            <select className="form-control" value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}>
              {LEAVE_TYPES.map(t => <option key={t} value={t} style={{ textTransform:'capitalize' }}>{t}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" className="form-control" value={form.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" className="form-control" value={form.endDate}
                min={form.startDate || new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          {form.startDate && form.endDate && (
            <div style={{ background:'var(--accent-bg)', color:'var(--accent)', borderRadius:8, padding:'8px 12px', fontSize:13, marginBottom:12 }}>
              📅 {calcDays()} working day(s)
            </div>
          )}
          <div className="form-group">
            <label>Reason</label>
            <textarea className="form-control" rows={3} placeholder="Describe the reason for leave..."
              value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              style={{ resize:'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ open, leave, onClose, onReviewed }) {
  const [status, setStatus] = useState('approved');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReview = async () => {
    setLoading(true);
    try {
      await apiReviewLeave(leave._id, { status, reviewComment: comment });
      toast.success(`Leave ${status}!`);
      onReviewed();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  if (!open || !leave) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Review Leave Request</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ background:'var(--surface-2)', borderRadius:8, padding:14, marginBottom:16, fontSize:13 }}>
            <strong>{leave.user?.name}</strong> · <span style={{ textTransform:'capitalize' }}>{leave.leaveType}</span> leave<br />
            <span style={{ color:'var(--text-secondary)' }}>
              {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()} ({leave.totalDays} days)
            </span><br />
            <span style={{ color:'var(--text-muted)', marginTop:6, display:'block' }}>{leave.reason}</span>
          </div>
          <div className="form-group">
            <label>Decision</label>
            <div className="flex gap-2">
              {['approved','rejected'].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`btn btn-sm ${status === s ? (s === 'approved' ? 'btn-success' : 'btn-danger') : 'btn-secondary'}`}
                  style={{ flex:1, justifyContent:'center', textTransform:'capitalize' }}>
                  {s === 'approved' ? '✓' : '✗'} {s}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Comment (optional)</label>
            <textarea className="form-control" rows={2} value={comment}
              onChange={e => setComment(e.target.value)} placeholder="Add a note to the applicant..." style={{ resize:'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={`btn ${status === 'approved' ? 'btn-success' : 'btn-danger'}`}
            onClick={handleReview} disabled={loading}>
            {loading ? 'Saving...' : `Confirm ${status}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeavePage() {
  const { hasRole } = useAuth();
  const isManager = hasRole('admin','manager','teacher');

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [reviewLeave, setReviewLeave] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      const res = await apiGetLeaves(params);
      setLeaves(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadLeaves(); }, [loadLeaves]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await apiCancelLeave(id);
      toast.success('Leave cancelled');
      loadLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusFilters = ['all','pending','approved','rejected','cancelled'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="tabs" style={{ maxWidth: 380 }}>
          {statusFilters.map(s => (
            <button key={s} className={`tab ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)} style={{ textTransform:'capitalize', fontSize:12 }}>
              {s}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setApplyOpen(true)}>
          + Apply Leave
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Leave Requests</h3>
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>{leaves.length} records</span>
        </div>
        {loading ? <div className="loader"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr>
                {isManager && <th>Applicant</th>}
                <th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th>
                {isManager && <th>Reviewed By</th>}
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {leaves.length === 0
                  ? <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--text-muted)', padding:32 }}>No leave requests found</td></tr>
                  : leaves.map(l => (
                    <tr key={l._id}>
                      {isManager && <td><strong>{l.user?.name}</strong><div style={{ fontSize:11,color:'var(--text-muted)',textTransform:'capitalize' }}>{l.user?.role}</div></td>}
                      <td style={{ textTransform:'capitalize' }}>{l.leaveType}</td>
                      <td>{new Date(l.startDate).toLocaleDateString()}</td>
                      <td>{new Date(l.endDate).toLocaleDateString()}</td>
                      <td>{l.totalDays}</td>
                      <td style={{ maxWidth:180, color:'var(--text-secondary)', fontSize:12 }}>{l.reason}</td>
                      <td><Badge status={l.status} /></td>
                      {isManager && <td style={{ fontSize:12, color:'var(--text-muted)' }}>{l.reviewedBy?.name || '—'}</td>}
                      <td>
                        <div className="flex gap-2">
                          {isManager && l.status === 'pending' && (
                            <button className="btn btn-primary btn-sm" onClick={() => setReviewLeave(l)}>Review</button>
                          )}
                          {!isManager && l.status === 'pending' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancel(l._id)}>Cancel</button>
                          )}
                          {l.reviewComment && (
                            <span title={l.reviewComment} style={{ cursor:'help', fontSize:16 }}>💬</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} onApplied={loadLeaves} />
      <ReviewModal open={!!reviewLeave} leave={reviewLeave} onClose={() => setReviewLeave(null)} onReviewed={loadLeaves} />
    </div>
  );
}
