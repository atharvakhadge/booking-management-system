const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    genre: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 1 }, // minutes
    rating: { type: String, default: 'UA', trim: true },
    hue: { type: Number, default: () => Math.floor(Math.random() * 360) }, // drives the poster color on the frontend
    showtimes: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A movie needs at least one showtime',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Movie', movieSchema);
