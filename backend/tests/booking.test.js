const request = require('supertest');
const app = require('../app');
const Movie = require('../models/Movie');
const Booking = require('../models/Booking');
const {
  connectTestDb,
  clearTestDb,
  closeTestDb,
  createAdminAndToken,
  fakeObjectId,
} = require('../testUtils');

let movie;

beforeAll(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  movie = await Movie.create({
    title: 'Test Movie',
    genre: 'Drama',
    duration: 120,
    rating: 'U',
    showtimes: ['02:00 PM'],
  });
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

describe('Booking API', () => {
  test('creates a booking for a valid movie/date/time/seats', async () => {
    const res = await request(app).post('/api/bookings').send({
      movieId: movie._id.toString(),
      date: '2026-10-01',
      time: '02:00 PM',
      seats: ['A1', 'A2'],
      name: 'Jane Doe',
      contact: 'jane@example.com',
    });

    expect(res.status).toBe(201);
    expect(res.body.bookingId).toMatch(/^BK\d+$/);
    expect(res.body.seats).toEqual(['A1', 'A2']);
    expect(res.body.movieTitle).toBe('Test Movie');
  });

  test('rejects a booking for a movie that does not exist', async () => {
    const res = await request(app).post('/api/bookings').send({
      movieId: fakeObjectId(),
      date: '2026-10-01',
      time: '02:00 PM',
      seats: ['A1'],
      name: 'Jane Doe',
      contact: 'jane@example.com',
    });

    expect(res.status).toBe(404);
  });

  test('rejects a booking missing required fields', async () => {
    const res = await request(app).post('/api/bookings').send({
      movieId: movie._id.toString(),
      date: '2026-10-01',
      time: '02:00 PM',
      seats: [],
    });

    expect(res.status).toBe(400);
  });

  test('prevents double-booking the same seat for the same showing', async () => {
    await request(app).post('/api/bookings').send({
      movieId: movie._id.toString(),
      date: '2026-10-01',
      time: '02:00 PM',
      seats: ['B5'],
      name: 'First Person',
      contact: 'first@example.com',
    });

    const res = await request(app).post('/api/bookings').send({
      movieId: movie._id.toString(),
      date: '2026-10-01',
      time: '02:00 PM',
      seats: ['B5'],
      name: 'Second Person',
      contact: 'second@example.com',
    });

    expect(res.status).toBe(409);
    expect(await Booking.countDocuments()).toBe(1);
  });

  test('allows the same seat number on a different date', async () => {
    await request(app).post('/api/bookings').send({
      movieId: movie._id.toString(),
      date: '2026-10-01',
      time: '02:00 PM',
      seats: ['B5'],
      name: 'First Person',
      contact: 'first@example.com',
    });

    const res = await request(app).post('/api/bookings').send({
      movieId: movie._id.toString(),
      date: '2026-10-02',
      time: '02:00 PM',
      seats: ['B5'],
      name: 'Second Person',
      contact: 'second@example.com',
    });

    expect(res.status).toBe(201);
  });

  test('taken-seats reflects existing bookings for that exact showing', async () => {
    await Booking.create({
      bookingId: 'BK9999',
      movieId: movie._id,
      movieTitle: movie.title,
      date: '2026-10-01',
      time: '02:00 PM',
      seats: ['C3', 'C4'],
      name: 'X',
      contact: 'x@example.com',
    });

    const res = await request(app).get(
      `/api/bookings/taken-seats?movieId=${movie._id}&date=2026-10-01&time=${encodeURIComponent('02:00 PM')}`
    );

    expect(res.status).toBe(200);
    expect(res.body.taken.sort()).toEqual(['C3', 'C4']);
  });

  test('GET /api/bookings is rejected without a token', async () => {
    const res = await request(app).get('/api/bookings');
    expect(res.status).toBe(401);
  });

  test('GET /api/bookings lists bookings for an authenticated admin', async () => {
    await request(app).post('/api/bookings').send({
      movieId: movie._id.toString(),
      date: '2026-10-01',
      time: '02:00 PM',
      seats: ['D1'],
      name: 'Someone',
      contact: 'someone@example.com',
    });

    const { token } = await createAdminAndToken();
    const res = await request(app).get('/api/bookings').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].seats).toEqual(['D1']);
  });
});
