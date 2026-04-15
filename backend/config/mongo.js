const mongoose = require('mongoose');

module.exports = async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // options optional for newer drivers
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
