const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');
const Problem = require('../src/models/Problem');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Problem.deleteMany({});

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    // Create sample problems
    const sampleProblems = [
      {
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: 'easy',
        tags: ['array', 'hash-table'],
        constraints: {
          timeLimit: 2000,
          memoryLimit: 256,
          inputConstraints: '2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9'
        },
        testCases: [
          { input: '4\n2 7 11 15\n9', output: '0 1', isExample: true },
          { input: '3\n3 2 4\n6', output: '1 2', isExample: true },
          { input: '2\n3 3\n6', output: '0 1', isExample: false }
        ],
        createdBy: adminUser._id,
        status: 'published'
      }
    ];

    await Problem.insertMany(sampleProblems);
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();