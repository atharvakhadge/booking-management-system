const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const { requireAuth } = require('../middleware/auth');

// GET /api/movies — list all movies (used by the "Now showing" page)
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: 1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// GET /api/movies/:id — a single movie (used by the booking page)
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(400).json({ error: 'Invalid movie id' });
  }
});

// POST /api/movies — add a movie (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, genre, duration, rating, showtimes } = req.body;
    if (!title || !genre || !duration || !Array.isArray(showtimes) || showtimes.length === 0) {
      return res.status(400).json({ error: 'title, genre, duration and at least one showtime are required' });
    }
    const movie = await Movie.create({ title, genre, duration, rating, showtimes });
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add movie' });
  }
});

// DELETE /api/movies/:id — remove a movie (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await Movie.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Movie not found' });
    res.json({ message: 'Movie deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid movie id' });
  }
});

module.exports = router;
