// backend/config/db.js
const mongoose = require('mongoose');

/**
 * Establishes a connection to the MongoDB database using the connection string
 * from the environment variables.
 */
const connectDB = async () => {
  try {
    // Attempt to connect to the MongoDB cluster
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // On successful connection, log a confirmation message
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If an error occurs during connection, log the error and exit the process
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit with a failure code
  }
};

module.exports = connectDB;
