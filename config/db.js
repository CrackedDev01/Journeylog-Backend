// MongoDB configuration using Mongoose
const mongoose = require('mongoose');

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose;

  // Concurrent requests on a cold start must await the same connection.
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    }).then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }).finally(() => {
      // Allow a later request to reconnect after a failure or disconnect.
      connectionPromise = undefined;
    });
  }

  return connectionPromise;
};

module.exports = connectDB;
