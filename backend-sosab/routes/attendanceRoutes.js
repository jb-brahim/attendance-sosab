const express = require('express');
const {
  markAttendance,
  getDailyAttendance,
  getWorkerAttendance,
  getDateRangeReport,
  getSingleAttendance,
  getWorkerHistoryRange,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection middleware to all attendance routes
router.use(protect);

// Mark attendance (Admin only)
router.post('/mark', authorize('admin'), markAttendance);

// Range reports (Admin & Gerant)
router.get('/range', authorize('admin', 'gerant'), getDateRangeReport);
router.get('/report', authorize('admin', 'gerant'), getDateRangeReport);

// Daily summary report (Admin & Gerant)
router.get('/daily/:date', authorize('admin', 'gerant'), getDailyAttendance);

// Worker history reports (Admin + Gerant)
router.get('/history/:workerId', authorize('admin', 'gerant'), getWorkerHistoryRange);
router.get('/worker/:workerId', authorize('admin', 'gerant'), getWorkerAttendance);

// Single worker attendance status for date (Admin + Gerant)
// Put this at the bottom to avoid route param collisions with static routes like /range or /report
router.get('/:workerId', authorize('admin', 'gerant'), getSingleAttendance);

module.exports = router;
