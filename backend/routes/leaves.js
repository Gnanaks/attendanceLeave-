const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Calculate working days between two dates (Mon-Sat)
const calcWorkingDays = (start, end) => {
  let count = 0;
  const cur = new Date(start);
  while (cur <= new Date(end)) {
    if (cur.getDay() !== 0) count++; // exclude Sunday
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// @GET /api/leaves
router.get('/', async (req, res) => {
  try {
    const { userId, status, leaveType, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'student' || req.user.role === 'employee') {
      filter.user = req.user._id;
    } else if (userId) {
      filter.user = userId;
    }

    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;

    const leaves = await Leave.find(filter)
      .populate('user', 'name email role department')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Leave.countDocuments(filter);
    res.json({ success: true, data: leaves, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/leaves - apply for leave
router.post('/', async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const totalDays = calcWorkingDays(startDate, endDate);

    // Check overlapping pending/approved leaves
    const overlap = await Leave.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
      ],
    });

    if (overlap) {
      return res.status(409).json({ success: false, message: 'Leave overlaps with an existing request' });
    }

    const leave = await Leave.create({
      user: req.user._id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
    });

    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/leaves/:id/review - approve or reject
router.put('/:id/review', authorize('admin', 'manager', 'teacher'), async (req, res) => {
  try {
    const { status, reviewComment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const leave = await Leave.findById(req.params.id).populate('user');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewComment = reviewComment;
    await leave.save();

    // If approved, mark attendance as on-leave for those days
    if (status === 'approved') {
      const cur = new Date(leave.startDate);
      const ops = [];
      while (cur <= new Date(leave.endDate)) {
        if (cur.getDay() !== 0) {
          ops.push({
            updateOne: {
              filter: { user: leave.user._id, date: new Date(cur) },
              update: { $set: { status: 'on-leave', markedBy: req.user._id } },
              upsert: true,
            },
          });
        }
        cur.setDate(cur.getDate() + 1);
      }
      if (ops.length) await Attendance.bulkWrite(ops);
    }

    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/leaves/:id/cancel - user cancels own pending leave
router.put('/:id/cancel', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

    if (leave.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled' });
    }

    leave.status = 'cancelled';
    await leave.save();
    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
