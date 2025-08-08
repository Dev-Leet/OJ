// backend/seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Problem = require('./models/Problem');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const sampleProblems = [
  {
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
    testCases: [
      { input: "2 7 11 15\n9", output: "0 1" },
      { input: "3 2 4\n6", output: "1 2" },
      { input: "3 3\n6", output: "0 1" },
    ]
  },
  {
    title: "Valid Palindrome",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
    difficulty: "Easy",
    tags: ["Two Pointers", "String"],
    constraints: "1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.",
    testCases: [
      { input: "A man, a plan, a canal: Panama", output: "true" },
      { input: "race a car", output: "false" },
      { input: " ", output: "true" },
    ]
  }
];

const importData = async () => {
  try {
    // Clear any existing data
    await Problem.deleteMany();
    await User.deleteMany();

    // Create a default admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123', // This will be hashed automatically by the User model's pre-save hook
      role: 'admin',
    });

    // Add the admin user's ID to each sample problem
    const problemsWithAdmin = sampleProblems.map(problem => {
      return { ...problem, createdBy: adminUser._id };
    });

    // Insert the sample problems into the database
    await Problem.insertMany(problemsWithAdmin);

    console.log('Data Imported! ✅');
    console.log('Admin User: admin@example.com');
    console.log('Password: password123');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
    try {
        await Problem.deleteMany();
        await User.deleteMany();
        console.log('Data Destroyed! ❌');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
};

// Check for command-line arguments to decide which function to run
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
