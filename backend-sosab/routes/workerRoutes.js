const express = require('express');
const {
  createWorker,
  getWorkers,
  updateWorker,
  deleteWorker,
} = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection middleware to all worker routes
router.use(protect);

// Admin & Gerant can read workers; only Admin can create
router
  .route('/')
  .post(authorize('admin'), createWorker)
  .get(authorize('admin', 'gerant'), getWorkers);

// Only Admin can update or delete workers
router
  .route('/:id')
  .put(authorize('admin'), updateWorker)
  .delete(authorize('admin'), deleteWorker);

module.exports = router;
