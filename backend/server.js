require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Movie = require('./models/Movie');
const Admin = require('./models/Admin');
const movieRoutes = require('./routes/movieRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/booking_management';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the Phase 1 frontend as static files, so the whole app runs from one
// server: http://localhost:5000/ loads the site, and it calls /api/* on the
// same origin (no separate frontend server or CORS setup needed).
app.use(express.static(path.join(__dirname, '../frontend')));

const DEFAULT_MOVIES = [
  { title: 'Nightwatch Protocol', genre: 'Sci-Fi Thriller', duration: 128, rating: 'UA', hue: 228, showtimes: ['02:30 PM', '05:45 PM', '09:00 PM'] },
  { title: 'The Last Ember', genre: 'Drama', duration: 142, rating: 'U', hue: 18, showtimes: ['01:00 PM', '04:15 PM', '07:30 PM'] },
  { title: 'Paper Tigers', genre: 'Comedy', duration: 104, rating: 'U', hue: 46, showtimes: ['11:30 AM', '03:00 PM', '06:30 PM'] },
  { title: 'Crimson Tide Rising', genre: 'Action', duration: 135, rating: 'UA', hue: 354, showtimes: ['12:15 PM', '04:00 PM', '08:15 PM'] },
  { title: 'Hollow Moon', genre: 'Horror', duration: 97, rating: 'A', hue: 265, showtimes: ['09:45 PM'] },
  { title: 'Meridian', genre: 'Adventure', duration: 118, rating: 'U', hue: 160, showtimes: ['10:00 AM', '01:30 PM', '05:00 PM'] },
];

async function seedMoviesIfEmpty() {
  const count = await Movie.countDocuments();
  if (count === 0) {
    await Movie.insertMany(DEFAULT_MOVIES);
    console.log('No movies found — seeded the default catalogue.');
  }
}

async function seedAdminIfEmpty() {
  const count = await Admin.countDocuments();
  if (count === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    await Admin.create({ username, passwordHash });
    console.log(`No admin account found — created one for username "${username}" using the credentials in .env.`);
  }
}

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    await seedMoviesIfEmpty();
    await seedAdminIfEmpty();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
