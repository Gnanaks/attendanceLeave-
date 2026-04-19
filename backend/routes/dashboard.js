const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// @GET /api/dashboard/stats - overview numbers
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59);

    const isAdmin = req.user.role === 'admin';
    const userFilter = isAdmin ? {} : { department: req.user.department };

    const [totalUsers, activeToday, pendingLeaves, todayAbsent] = await Promise.all([
      User.countDocuments({ ...userFilter, isActive: true }),
      Attendance.countDocuments({
        date: { $gte: today, $lte: todayEnd },
        status: { $in: ['present', 'late', 'half-day'] },
      }),
      Leave.countDocuments({ status: 'pending' }),
      Attendance.countDocuments({
        date: { $gte: today, $lte: todayEnd },
        status: 'absent',
      }),
    ]);

    // Weekly attendance trend (last 7 days)
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59);

      const present = await Attendance.countDocuments({
        date: { $gte: d, $lte: dEnd },
        status: { $in: ['present', 'late'] },
      });

      last7.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        present,
      });
    }

    // Leave breakdown by type
    const leaveBreakdown = await Leave.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$leaveType', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeToday,
        pendingLeaves,
        todayAbsent,
        attendanceRate: totalUsers ? Math.round((activeToday / totalUsers) * 100) : 0,
        weeklyTrend: last7,
        leaveBreakdown,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
