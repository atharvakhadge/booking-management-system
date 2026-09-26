const request = require('supertest');
const app = require('../app');
const Movie = require('../models/Movie');
const {
  connectTestDb,
  clearTestDb,
  closeTestDb,
  createAdminAndToken,
} = require('../testUtils');

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

describe('Movies API', () => {
  test('GET /api/movies returns an empty list when there are none', async () => {
    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('GET /api/movies/:id 404s for an id that does not exist', async () => {
    const { fakeObjectId } = require('../testUtils');
    const res = await request(app).get(`/api/movies/${fakeObjectId()}`);
    expect(res.status).toBe(404);
  });

  test('POST /api/movies is rejected without a token', async () => {
    const res = await request(app)
      .post('/api/movies')
      .send({ title: 'Test Movie', genre: 'Drama', duration: 100, showtimes: ['1:00 PM'] });
    expect(res.status).toBe(401);
  });

  test('POST /api/movies is rejected with a garbage token', async () => {
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ title: 'Test Movie', genre: 'Drama', duration: 100, showtimes: ['1:00 PM'] });
    expect(res.status).toBe(401);
  });

  test('POST /api/movies adds a movie when authenticated', async () => {
    const { token } = await createAdminAndToken();
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Movie', genre: 'Drama', duration: 100, rating: 'U', showtimes: ['1:00 PM'] });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Movie');
    expect(await Movie.countDocuments()).toBe(1);
  });

  test('POST /api/movies rejects a movie with no showtimes', async () => {
    const { token } = await createAdminAndToken();
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No Showtimes', genre: 'Drama', duration: 90, showtimes: [] });

    expect(res.status).toBe(400);
  });

  test('DELETE /api/movies/:id is rejected without a token', async () => {
    const movie = await Movie.create({ title: 'X', genre: 'Y', duration: 90, showtimes: ['1 PM'] });
    const res = await request(app).delete(`/api/movies/${movie._id}`);
    expect(res.status).toBe(401);
    expect(await Movie.findById(movie._id)).not.toBeNull();
  });

  test('DELETE /api/movies/:id removes the movie when authenticated', async () => {
    const { token } = await createAdminAndToken();
    const movie = await Movie.create({ title: 'X', genre: 'Y', duration: 90, showtimes: ['1 PM'] });

    const res = await request(app)
      .delete(`/api/movies/${movie._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(await Movie.findById(movie._id)).toBeNull();
  });
});
