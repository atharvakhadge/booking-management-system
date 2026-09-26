const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('./models/Admin');
const { JWT_SECRET } = require('./middleware/auth');

// Uses a separate database from your development one, so running tests never
// touches the movies/bookings you see in the app.
const TEST_MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/booking_management_test';

async function connectTestDb() {
  await mongoose.connect(TEST_MONGO_URI);
}

async function clearTestDb() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

async function closeTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

async function createAdmin(username = 'tester', password = 'testpass123') {
  const passwordHash = await bcrypt.hash(password, 10);
  return Admin.create({ username, passwordHash });
}

async function createAdminAndToken(username = 'tester', password = 'testpass123') {
  const admin = await createAdmin(username, password);
  const token = jwt.sign({ sub: admin._id.toString(), username: admin.username }, JWT_SECRET);
  return { admin, token };
}

function fakeObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

module.exports = {
  connectTestDb,
  clearTestDb,
  closeTestDb,
  createAdmin,
  createAdminAndToken,
  fakeObjectId,
};
