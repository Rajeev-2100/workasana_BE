const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URL;

let cachedConnection = null; 

const initializationDatabase = async () => {
  if (cachedConnection) {
    console.log('Using cached DB connection');
    return cachedConnection;
  }

  try {
    const connect = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cachedConnection = connect;
    console.log('Database connected successfully');
    return connect;
  } catch (error) {
    console.error('DB connection error:', error.message);
    throw error;
  }
};

module.exports = initializationDatabase;