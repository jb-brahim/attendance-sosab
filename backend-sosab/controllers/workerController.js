const Worker = require('../models/Worker');

// @desc    Create a new worker
// @route   POST /api/workers
// @access  Private/Admin
const createWorker = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const jobRole = req.body.jobRole || req.body.position;

    if (!name || !jobRole) {
      return res.status(400).json({
        success: false,
        error: 'Please provide worker name and position/job role',
      });
    }

    const phoneVal = (phone || '').trim();
    if (phoneVal) {
      // Check if worker with the same phone number already exists
      const existingWorker = await Worker.findOne({ phone: phoneVal });
      if (existingWorker) {
        return res.status(400).json({
          success: false,
          error: `A worker with the phone number '${phoneVal}' is already registered`,
        });
      }
    }

    const worker = await Worker.create({
      name,
      phone: phoneVal,
      email: email || '',
      jobRole,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Worker created successfully',
      data: worker,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workers
// @route   GET /api/workers
// @access  Private (Admin + Boss)
const getWorkers = async (req, res, next) => {
  try {
    const { active } = req.query;
    const filter = {};

    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const workers = await Worker.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a worker
// @route   PUT /api/workers/:id
// @access  Private/Admin
const updateWorker = async (req, res, next) => {
  try {
    const { name, phone, email, isActive } = req.body;
    const jobRole = req.body.jobRole || req.body.position;

    let worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: `Worker not found with ID of ${req.params.id}`,
      });
    }

    // Update fields if provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (jobRole !== undefined) updateData.jobRole = jobRole;
    if (isActive !== undefined) updateData.isActive = isActive;

    worker = await Worker.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Worker updated successfully',
      data: worker,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a worker
// @route   DELETE /api/workers/:id
// @access  Private/Admin
const deleteWorker = async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: `Worker not found with ID of ${req.params.id}`,
      });
    }

    await worker.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Worker deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorker,
  getWorkers,
  updateWorker,
  deleteWorker,
};
