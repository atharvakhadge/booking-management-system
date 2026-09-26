const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true }, // human-friendly id, e.g. BK261234
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  movieTitle: { type: String, required: true }, // denormalized so old bookings still read fine if a movie is later deleted
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // e.g. "07:00 PM"
  seats: {
    type: [String], // e.g. ["A1", "A2"]
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: 'A booking needs at least one seat',
    },
  },
  name: { type: String, required: true, trim: true },
  contact: { type: String, required: true, trim: true },
  bookedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);
