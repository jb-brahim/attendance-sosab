const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');
const mongoose = require('mongoose');

// @desc    Mark daily attendance (Create or Update)
// @route   POST /api/attendance/mark
// @access  Private (Boss + Admin)
const markAttendance = async (req, res, next) => {
  try {
    let { date, records } = req.body;

    // Support both single record and bulk payloads
    if (req.body.workerId && req.body.status && req.body.date) {
      date = req.body.date;
      records = [{
        workerId: req.body.workerId,
        status: req.body.status,
        notes: req.body.note || req.body.notes || '',
      }];
    }

    // Validate inputs
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a date',
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Please use YYYY-MM-DD format for date',
      });
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of attendance records',
      });
    }

    // Validate statuses and worker IDs
    const validStatuses = ['present', 'absent', 'late', 'leave'];
    const bulkOperations = [];

    for (const record of records) {
      const { workerId, status, notes } = record;

      if (!workerId || !status) {
        return res.status(400).json({
          success: false,
          error: 'Each record must contain a workerId and a status',
        });
      }

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status '${status}'. Must be present, absent, or late`,
        });
      }

      if (!mongoose.Types.ObjectId.isValid(workerId)) {
        return res.status(400).json({
          success: false,
          error: `Invalid worker ID format: '${workerId}'`,
        });
      }

      // Build bulk upsert operation
      bulkOperations.push({
        updateOne: {
          filter: { workerId: workerId, date: date },
          update: {
            $set: {
              status: status,
              markedBy: req.user._id,
              notes: notes || '',
            },
          },
          upsert: true,
        },
      });
    }

    // Execute bulk write operation
    const result = await Attendance.bulkWrite(bulkOperations);

    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      summary: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily attendance summary & records
// @route   GET /api/attendance/daily/:date
// @access  Private/Admin
const getDailyAttendance = async (req, res, next) => {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Please use YYYY-MM-DD format for date in the URL parameter',
      });
    }

    // Fetch all active workers
    const totalActiveWorkers = await Worker.countDocuments({ isActive: true });

    // Fetch attendance records for the date
    const records = await Attendance.find({ date })
      .populate('workerId', 'name jobRole phone isActive')
      .populate('markedBy', 'name email');

    // Calculate summary statistics
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    records.forEach((record) => {
      if (record.status === 'present') presentCount++;
      else if (record.status === 'absent') absentCount++;
      else if (record.status === 'late') lateCount++;
    });

    res.status(200).json({
      success: true,
      summary: {
        date,
        totalActiveWorkers,
        totalMarked: records.length,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
      },
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance history and metrics for a specific worker
// @route   GET /api/attendance/worker/:workerId
// @access  Private (Admin + Boss)
const getWorkerAttendance = async (req, res, next) => {
  try {
    const { workerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid worker ID format',
      });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        error: `Worker not found with ID of ${workerId}`,
      });
    }

    // Fetch all attendance logs for this worker, sorted by date descending
    const records = await Attendance.find({ workerId })
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Calculate metrics
    let present = 0;
    let absent = 0;
    let late = 0;

    records.forEach((rec) => {
      if (rec.status === 'present') present++;
      else if (rec.status === 'absent') absent++;
      else if (rec.status === 'late') late++;
    });

    const total = records.length;
    // Attendance percentage counts 'present' and 'late' as attending
    const attendancePercentage =
      total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    res.status(200).json({
      success: true,
      worker: {
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        jobRole: worker.jobRole,
        isActive: worker.isActive,
      },
      metrics: {
        totalDaysLogged: total,
        presentDays: present,
        absentDays: absent,
        lateDays: late,
        attendancePercentage: attendancePercentage,
      },
      history: records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance range report grouped by worker
// @route   GET /attendance/report or /attendance/range
// @access  Private/Admin
const getDateRangeReport = async (req, res, next) => {
  try {
    const start = req.query.startDate || req.query.start;
    const end = req.query.endDate || req.query.end;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Please provide start and end date parameters (?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD)',
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
      return res.status(400).json({
        success: false,
        error: 'Dates must be in YYYY-MM-DD format',
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be after end date',
      });
    }

    // Aggregation pipeline to group and calculate metrics by worker
    const report = await Attendance.aggregate([
      // 1. Filter by date range (string matching works perfectly for YYYY-MM-DD)
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      // 2. Group by workerId and calculate counts
      {
        $group: {
          _id: '$workerId',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
          },
          late: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
          },
          leave: {
            $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] },
          },
          // Keep a list of matching logs for history
          history: {
            $push: {
              date: '$date',
              status: '$status',
              notes: '$notes',
              _id: '$_id',
            },
          },
        },
      },
      // 3. Populate worker info
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: '_id',
          as: 'workerDetails',
        },
      },
      // 4. Unwind the populated worker array (since lookup returns an array)
      {
        $unwind: '$workerDetails',
      },
      // 5. Project the final structure
      {
        $project: {
          _id: 0,
          worker: {
            _id: '$workerDetails._id',
            name: '$workerDetails.name',
            phone: '$workerDetails.phone',
            jobRole: '$workerDetails.jobRole',
            isActive: '$workerDetails.isActive',
          },
          metrics: {
            totalDaysLogged: '$total',
            presentDays: '$present',
            absentDays: '$absent',
            lateDays: '$late',
            leaveDays: '$leave',
            attendancePercentage: {
              $cond: [
                { $gt: ['$total', 0] },
                {
                  $round: [
                    {
                      $multiply: [
                        {
                          $divide: [
                            { $add: ['$present', '$late'] }, // Present & Late count as attending
                            '$total',
                          ],
                        },
                        100,
                      ],
                    },
                    0,
                  ],
                },
                0,
              ],
            },
          },
          history: {
            $sortArray: { input: '$history', sortBy: { date: -1 } },
          },
        },
      },
      // 6. Sort by worker name alphabetically
      {
        $sort: { 'worker.name': 1 },
      },
    ]);

    res.status(200).json(report); // Return aggregation array directly for frontend mapping
  } catch (error) {
    next(error);
  }
};

// @desc    Get single worker attendance for a specific date
// @route   GET /attendance/:workerId?date=YYYY-MM-DD
// @access  Private (Admin + Gerant)
const getSingleAttendance = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a date query parameter (?date=YYYY-MM-DD)',
      });
    }

    const record = await Attendance.findOne({ workerId, date })
      .populate('workerId', 'name jobRole phone isActive')
      .populate('markedBy', 'name email');

    res.status(200).json(record || null);
  } catch (error) {
    next(error);
  }
};

// @desc    Get worker attendance history filtered by date range
// @route   GET /attendance/history/:workerId?startDate=...&endDate=...
// @access  Private (Admin + Gerant)
const getWorkerHistoryRange = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Please provide startDate and endDate query parameters',
      });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        error: `Worker not found with ID of ${workerId}`,
      });
    }

    const records = await Attendance.find({
      workerId,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Calculate metrics
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    records.forEach((rec) => {
      if (rec.status === 'present') present++;
      else if (rec.status === 'absent') absent++;
      else if (rec.status === 'late') late++;
      else if (rec.status === 'leave') leave++;
    });

    const total = records.length;
    const attendancePercentage =
      total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    res.status(200).json({
      worker: {
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        jobRole: worker.jobRole,
        isActive: worker.isActive,
      },
      metrics: {
        totalDaysLogged: total,
        presentDays: present,
        absentDays: absent,
        lateDays: late,
        leaveDays: leave,
        attendancePercentage,
      },
      history: records,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getDailyAttendance,
  getWorkerAttendance,
  getDateRangeReport,
  getSingleAttendance,
  getWorkerHistoryRange,
};
