const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// @GET /api/attendance - fetch records
router.get('/', async (req, res) => {
  try {
    const { userId, startDate, endDate, status, page = 1, limit = 31 } = req.query;
    const filter = {};

    // Non-admin can only see their own
    if (req.user.role === 'student' || req.user.role === 'employee') {
      filter.user = req.user._id;
    } else if (userId) {
      filter.user = userId;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }

    if (status) filter.status = status;

    const records = await Attendance.find(filter)
      .populate('user', 'name email role department')
      .populate('markedBy', 'name role')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Attendance.countDocuments(filter);

    res.json({ success: true, data: records, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/attendance/summary/:userId - monthly summary
router.get('/summary/:userId', async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year)  || new Date().getFullYear();

    const start = new Date(y, m - 1, 1);
    const end   = new Date(y, m, 0, 23, 59, 59);

    const records = await Attendance.find({
      user: req.params.userId,
      date: { $gte: start, $lte: end },
    });

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent:  records.filter(r => r.status === 'absent').length,
      late:    records.filter(r => r.status === 'late').length,
      halfDay: records.filter(r => r.status === 'half-day').length,
      onLeave: records.filter(r => r.status === 'on-leave').length,
      totalHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
    };

    res.json({ success: true, data: { summary, records } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/attendance - mark attendance (teacher/manager/admin or self check-in)
router.post('/', async (req, res) => {
  try {
    const { userId, date, status, checkIn, checkOut, notes, records } = req.body;

    // Bulk mark (teacher marking whole class)
    if (records && Array.isArray(records)) {
      if (!['admin','manager','teacher'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Not authorized for bulk marking' });
      }

      const ops = records.map(r => ({
        updateOne: {
          filter: { user: r.userId, date: new Date(r.date) },
          update: { $set: { ...r, markedBy: req.user._id } },
          upsert: true,
        },
      }));

      await Attendance.bulkWrite(ops);
      return res.json({ success: true, message: `${records.length} records saved` });
    }

    // Single mark
    const targetUser = userId || req.user._id;
    const calcHours = (ci, co) => {
      if (!ci || !co) return 0;
      const [h1, m1] = ci.split(':').map(Number);
      const [h2, m2] = co.split(':').map(Number);
      return parseFloat(((h2 * 60 + m2 - h1 * 60 - m1) / 60).toFixed(2));
    };

    const record = await Attendance.findOneAndUpdate(
      { user: targetUser, date: new Date(date) },
      {
        status,
        checkIn,
        checkOut,
        workingHours: calcHours(checkIn, checkOut),
        notes,
        markedBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/attendance/:id - update a record
router.put('/:id', authorize('admin', 'manager', 'teacher'), async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/attendance/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
