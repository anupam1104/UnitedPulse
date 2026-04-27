const mongoose = require('mongoose');

const DB_NAME = process.env.MONGO_DB_NAME || 'test';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    const conn = await mongoose.connect(uri, { dbName: DB_NAME });
    console.log(`MongoDB Connected: ${conn.connection.host} | Database: ${DB_NAME}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

