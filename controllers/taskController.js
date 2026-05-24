const Task = require('../models/Task');
const { asyncHandler } = require('../utils/helpers');

/**
 * @desc    Get all tasks for the logged-in user
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    category,
    search,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 50,
    completed,
  } = req.query;

  const query = { userId: req.user._id };

  // Filters
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = { $regex: category, $options: 'i' };
  if (completed !== undefined) query.completed = completed === 'true';
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sortOptions = { [sortBy]: sortOrder };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('comments.author', 'name avatar');

  res.status(200).json({
    success: true,
    data: {
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('comments.author', 'name avatar');

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  res.status(200).json({ success: true, data: { task } });
});

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    priority,
    status,
    category,
    tags,
    dueDate,
    subtasks,
    reminder,
    estimatedTime,
  } = req.body;

  const task = await Task.create({
    title,
    description,
    priority,
    status,
    category,
    tags,
    dueDate,
    subtasks,
    reminder,
    estimatedTime,
    userId: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task },
  });
});

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const updates = [
    'title', 'description', 'priority', 'status', 'category', 'tags',
    'dueDate', 'subtasks', 'reminder', 'estimatedTime', 'actualTime', 'order',
  ];

  updates.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: { task },
  });
});

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

/**
 * @desc    Update task status only
 * @route   PATCH /api/tasks/:id/status
 * @access  Private
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['todo', 'in-progress', 'review', 'completed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.status = status;
  await task.save();

  res.status(200).json({
    success: true,
    message: 'Task status updated',
    data: { task },
  });
});

/**
 * @desc    Add a comment to a task
 * @route   POST /api/tasks/:id/comments
 * @access  Private
 */
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) {
    return res.status(400).json({ success: false, message: 'Comment text is required' });
  }

  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.comments.push({ text, author: req.user._id });
  await task.save();
  await task.populate('comments.author', 'name avatar');

  res.status(201).json({ success: true, message: 'Comment added', data: { task } });
});

/**
 * @desc    Get task analytics / stats
 * @route   GET /api/tasks/stats
 * @access  Private
 */
const getTaskStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [statusCounts, priorityCounts, completedThisWeek, overdue] = await Promise.all([
    Task.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: { userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({
      userId,
      status: 'completed',
      completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
    Task.countDocuments({
      userId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
    }),
  ]);

  const total = await Task.countDocuments({ userId });
  const completed = await Task.countDocuments({ userId, status: 'completed' });
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Get daily activity for past 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dailyActivity = await Task.aggregate([
    { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        total,
        completed,
        completionRate,
        overdue,
        completedThisWeek,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        priorityCounts: priorityCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        dailyActivity,
      },
    },
  });
});

/**
 * @desc    Bulk update task orders (for drag-and-drop)
 * @route   PUT /api/tasks/reorder
 * @access  Private
 */
const reorderTasks = asyncHandler(async (req, res) => {
  const { tasks } = req.body; // Array of { _id, order, status }

  const bulkOps = tasks.map(({ _id, order, status }) => ({
    updateOne: {
      filter: { _id, userId: req.user._id },
      update: { $set: { order, status } },
    },
  }));

  await Task.bulkWrite(bulkOps);

  res.status(200).json({ success: true, message: 'Tasks reordered successfully' });
});

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
  getTaskStats,
  reorderTasks,
};
