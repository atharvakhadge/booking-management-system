const request = require('supertest');
const app = require('../app');
const { connectTestDb, clearTestDb, closeTestDb, createAdmin } = require('../testUtils');

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

describe('Auth API', () => {
  test('logs in successfully with correct credentials', async () => {
    await createAdmin('admin', 'secret123');

    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(10);
  });

  test('rejects an incorrect password', async () => {
    await createAdmin('admin', 'secret123');

    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('rejects a username that does not exist', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'whatever' });
    expect(res.status).toBe(401);
  });

  test('rejects a login request missing a password', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin' });
    expect(res.status).toBe(400);
  });
});
