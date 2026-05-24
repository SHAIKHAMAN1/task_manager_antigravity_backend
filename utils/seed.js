require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');

const SEED_DATA = {
  user: {
    name: 'Demo User',
    email: 'demo@taskflow.ai',
    password: 'demo123',
    bio: 'Full-stack developer passionate about productivity tools.',
  },
  tasks: [
    {
      title: 'Design new onboarding flow',
      description: 'Create wireframes and prototype for the new user onboarding experience. Focus on reducing time-to-value.',
      priority: 'high',
      status: 'in-progress',
      category: 'Design',
      tags: ['ux', 'design', 'onboarding'],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      subtasks: [
        { title: 'Create wireframes', completed: true },
        { title: 'Build prototype in Figma', completed: false },
        { title: 'User testing', completed: false },
      ],
    },
    {
      title: 'Implement authentication API',
      description: 'Build secure JWT authentication endpoints with refresh token support.',
      priority: 'urgent',
      status: 'completed',
      category: 'Development',
      tags: ['backend', 'auth', 'jwt'],
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      subtasks: [
        { title: 'Register endpoint', completed: true },
        { title: 'Login endpoint', completed: true },
        { title: 'JWT middleware', completed: true },
      ],
    },
    {
      title: 'Fix responsive layout on mobile',
      description: 'Several components break on screens below 375px width. Needs immediate attention.',
      priority: 'high',
      status: 'todo',
      category: 'Bug Fix',
      tags: ['mobile', 'css', 'responsive'],
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Write API documentation',
      description: 'Document all REST API endpoints with request/response examples using OpenAPI 3.0.',
      priority: 'medium',
      status: 'review',
      category: 'Documentation',
      tags: ['docs', 'api'],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment to production.',
      priority: 'medium',
      status: 'todo',
      category: 'Infrastructure',
      tags: ['devops', 'cicd', 'github'],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Q4 Marketing Campaign Planning',
      description: 'Plan and coordinate the Q4 marketing campaign across all channels.',
      priority: 'high',
      status: 'in-progress',
      category: 'Marketing',
      tags: ['marketing', 'strategy'],
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Database performance optimization',
      description: 'Analyze slow queries and add appropriate indexes. Target < 100ms response time.',
      priority: 'medium',
      status: 'todo',
      category: 'Development',
      tags: ['database', 'performance', 'mongodb'],
    },
    {
      title: 'Weekly team standup',
      description: 'Weekly sync meeting with the development team.',
      priority: 'low',
      status: 'completed',
      category: 'Meeting',
      tags: ['meeting', 'team'],
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'User research interviews',
      description: 'Conduct 5 user interviews to gather feedback on the new dashboard design.',
      priority: 'medium',
      status: 'todo',
      category: 'Research',
      tags: ['research', 'ux', 'interviews'],
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      estimatedTime: 180,
    },
    {
      title: 'Implement dark mode',
      description: 'Add system-level dark mode detection and manual toggle with preference persistence.',
      priority: 'low',
      status: 'completed',
      category: 'Feature',
      tags: ['ui', 'dark-mode'],
    },
    {
      title: 'Code review - PR #42',
      description: 'Review pull request for the new search feature implementation.',
      priority: 'medium',
      status: 'review',
      category: 'Development',
      tags: ['code-review', 'pr'],
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Update dependencies',
      description: 'Audit and update all npm packages to latest stable versions. Check for breaking changes.',
      priority: 'low',
      status: 'todo',
      category: 'Infrastructure',
      tags: ['maintenance', 'npm'],
    },
  ],
};

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing demo data
    const existingUser = await User.findOne({ email: SEED_DATA.user.email });
    if (existingUser) {
      await Task.deleteMany({ userId: existingUser._id });
      await User.findByIdAndDelete(existingUser._id);
      console.log('🗑️  Cleared existing demo data');
    }

    // Create demo user
    const user = await User.create(SEED_DATA.user);
    console.log(`👤 Created demo user: ${user.email}`);

    // Create tasks
    const tasks = SEED_DATA.tasks.map((task) => ({
      ...task,
      userId: user._id,
      completed: task.status === 'completed',
      completedAt: task.status === 'completed' ? new Date() : null,
    }));

    const createdTasks = await Task.insertMany(tasks);
    console.log(`📋 Created ${createdTasks.length} tasks`);

    console.log('\n🚀 Seed complete! Demo credentials:');
    console.log('   Email: demo@taskflow.ai');
    console.log('   Password: demo123\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seedDB();
