import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { apiGetDashboardStats, apiGetSummary } from '../utils/api';

const PIE_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: color + '18' }}>
      <svg fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2} style={{ width:22,height:22 }}>
        {icon}
      </svg>
    </div>
    <div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [mySummary, setMySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, summaryRes] = await Promise.all([
          apiGetDashboardStats(),
          apiGetSummary(user._id, {
            month: new Date().getMonth() + 1,
            year:  new Date().getFullYear(),
          }),
        ]);
        setStats(statsRes.data.data);
        setMySummary(summaryRes.data.data.summary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user._id]);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  const isAdmin = ['admin','manager','teacher'].includes(user.role);

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>Good {greeting()}, {user.name.split(' ')[0]} 👋</h2>
        <p className="text-muted text-sm" style={{ marginTop: 4 }}>
          Here's what's happening today, {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
        </p>
      </div>

      {/* Admin/Manager stats */}
      {isAdmin && stats && (
        <div className="stats-grid">
          <StatCard label="Total Users" value={stats.totalUsers} color="#6366f1"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>}
          />
          <StatCard label="Present Today" value={stats.activeToday} color="#10b981"
            sub={`${stats.attendanceRate}% rate`}
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>}
          />
          <StatCard label="Absent Today" value={stats.todayAbsent} color="#ef4444"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>}
          />
          <StatCard label="Pending Leaves" value={stats.pendingLeaves} color="#f59e0b"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>}
          />
        </div>
      )}

      {/* My monthly summary */}
      {mySummary && (
        <div className="stats-grid mb-6">
          {[
            { label: 'Present',   value: mySummary.present,  color: '#10b981' },
            { label: 'Absent',    value: mySummary.absent,   color: '#ef4444' },
            { label: 'Late',      value: mySummary.late,     color: '#f59e0b' },
            { label: 'On Leave',  value: mySummary.onLeave,  color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Syne,sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>This month · {s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      {isAdmin && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          {/* Weekly trend */}
          <div className="card">
            <div className="card-header"><h3>Weekly Attendance Trend</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.weeklyTrend} barSize={28}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="present" fill="#6366f1" radius={[6,6,0,0]} name="Present" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leave breakdown */}
          <div className="card">
            <div className="card-header"><h3>Leave Types</h3></div>
            <div className="card-body">
              {stats.leaveBreakdown.length === 0 ? (
                <div className="empty-state"><p>No leave data yet</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={stats.leaveBreakdown} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={75} label={({ _id }) => _id}>
                      {stats.leaveBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
