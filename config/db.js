// MongoDB configuration using Mongoose
const mongoose = require('mongoose');

const connectDB = async (retries = 5) => {
  // Fail fast on server selection so a DNS/Atlas blip surfaces as a
  // 503 with a retryable message instead of hanging the request for 60s+
  // and misleading the client with a 401 "token failed".
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;