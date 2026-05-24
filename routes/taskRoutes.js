const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
  getTaskStats,
  reorderTasks,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(protect);

// Stats (must be before /:id routes)
router.get('/stats', getTaskStats);

// Bulk reorder
router.put('/reorder', reorderTasks);

// CRUD
router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

// Status update
router.patch('/:id/status', updateTaskStatus);

// Comments
router.post('/:id/comments', addComment);

module.exports = router;
