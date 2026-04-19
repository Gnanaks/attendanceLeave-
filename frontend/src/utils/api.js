import axios from 'axios';

// Auth
export const apiLogin = (data) => axios.post('/auth/login', data);
export const apiRegister = (data) => axios.post('/auth/register', data);
export const apiMe = () => axios.get('/auth/me');
export const apiChangePassword = (data) => axios.put('/auth/change-password', data);

// Users
export const apiGetUsers = (params) => axios.get('/users', { params });
export const apiGetUser = (id) => axios.get(`/users/${id}`);
export const apiCreateUser = (data) => axios.post('/users', data);
export const apiUpdateUser = (id, data) => axios.put(`/users/${id}`, data);
export const apiDeleteUser = (id) => axios.delete(`/users/${id}`);

// Attendance
export const apiGetAttendance = (params) => axios.get('/attendance', { params });
export const apiMarkAttendance = (data) => axios.post('/attendance', data);
export const apiUpdateAttendance = (id, data) => axios.put(`/attendance/${id}`, data);
export const apiGetSummary = (userId, params) => axios.get(`/attendance/summary/${userId}`, { params });

// Leaves
export const apiGetLeaves = (params) => axios.get('/leaves', { params });
export const apiApplyLeave = (data) => axios.post('/leaves', data);
export const apiReviewLeave = (id, data) => axios.put(`/leaves/${id}/review`, data);
export const apiCancelLeave = (id) => axios.put(`/leaves/${id}/cancel`);

// Dashboard
export const apiGetDashboardStats = () => axios.get('/dashboard/stats');

// Format date to YYYY-MM-DD
export const fmtDate = (d) => new Date(d).toISOString().split('T')[0];

// Get initials from name
export const initials = (name) =>
  name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';

// Status color map
export const statusColors = {
  present:   { bg: '#dcfce7', text: '#166534' },
  absent:    { bg: '#fee2e2', text: '#991b1b' },
  late:      { bg: '#fef9c3', text: '#854d0e' },
  'half-day':{ bg: '#dbeafe', text: '#1e40af' },
  'on-leave':{ bg: '#f3e8ff', text: '#6b21a8' },
  holiday:   { bg: '#f1f5f9', text: '#475569' },
  pending:   { bg: '#fef9c3', text: '#854d0e' },
  approved:  { bg: '#dcfce7', text: '#166534' },
  rejected:  { bg: '#fee2e2', text: '#991b1b' },
  cancelled: { bg: '#f1f5f9', text: '#475569' },
};
