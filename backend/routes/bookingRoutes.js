const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const { requireAuth } = require('../middleware/auth');

function generateBookingId() {
  const year = new Date().getFullYear().toString().slice(2);
  const n = Math.floor(1000 + Math.random() * 9000);
  return `BK${year}${n}`;
}

// GET /api/bookings — list every booking (admin only)
router.get('/', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ bookedAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/taken-seats?movieId=&date=&time=
// Returns which seats are already booked for a given showing, so the
// frontend seat map can grey them out and block double-booking.
router.get('/taken-seats', async (req, res) => {
  try {
    const { movieId, date, time } = req.query;
    if (!movieId || !date || !time) {
      return res.status(400).json({ error: 'movieId, date and time are required' });
    }
    const bookings = await Booking.find({ movieId, date, time });
    const taken = bookings.flatMap((b) => b.seats);
    res.json({ taken });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seat availability' });
  }
});

// POST /api/bookings — create a booking
router.post('/', async (req, res) => {
  try {
    const { movieId, date, time, seats, name, contact } = req.body;
    if (!movieId || !date || !time || !Array.isArray(seats) || seats.length === 0 || !name || !contact) {
      return res.status(400).json({ error: 'movieId, date, time, seats, name and contact are required' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    // Re-check on the server so two people can't grab the same seat at once
    const existing = await Booking.find({ movieId, date, time });
    const takenSeats = new Set(existing.flatMap((b) => b.seats));
    const conflict = seats.find((s) => takenSeats.has(s));
    if (conflict) {
      return res.status(409).json({ error: `Seat ${conflict} was just taken. Please pick another seat.` });
    }

    let bookingId;
    let isUnique = false;
    while (!isUnique) {
      bookingId = generateBookingId();
      isUnique = !(await Booking.exists({ bookingId }));
    }

    const booking = await Booking.create({
      bookingId,
      movieId,
      movieTitle: movie.title,
      date,
      time,
      seats,
      name,
      contact,
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

module.exports = router;
