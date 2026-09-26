const path = require('path');
const express = require('express');
const cors = require('cors');

const movieRoutes = require('./routes/movieRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the frontend as static files, so the whole app runs from one server:
// http://localhost:5000/ loads the site, and it calls /api/* on the same
// origin (no separate frontend server or CORS setup needed).
app.use(express.static(path.join(__dirname, '../frontend')));

module.exports = app;
