# Booking Management System — Movie Ticket Booking

## Project structure

```
booking-management-system/
│
├── frontend/
│   ├── index.html       Now-showing movie grid
│   ├── booking.html     Date/time/seat selection + booking confirmation
│   ├── login.html       Admin login
│   ├── bookings.html    Admin (protected): add/delete movies, view all bookings
│   ├── style.css
│   └── script.js        API client (fetch wrappers), auth/session helpers, shared utilities
│
├── backend/
│   ├── server.js         Connects to MongoDB, seeds data, starts listening
│   ├── app.js            The Express app itself (routes, middleware) — imported by server.js and by the tests
│   ├── testUtils.js      Shared test helpers (test DB connection, admin/token factories)
│   ├── tests/
│   │   ├── movies.test.js
│   │   ├── auth.test.js
│   │   └── booking.test.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── movieRoutes.js
│   │   └── bookingRoutes.js
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Movie.js
│   │   └── Booking.js
│   ├── middleware/
│   │   └── auth.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## Running it locally

1. **Start MongoDB** — either run `mongod` locally, or use a free MongoDB Atlas cluster.
2. **Configure the backend**
   ```bash
   cd backend
   cp .env.example .env
   # edit .env if you're using Atlas instead of a local Mongo instance
   npm install
   npm run dev        # or: npm start
   ```
   On first run:
   - if the `movies` collection is empty, the server seeds it with 6 sample movies automatically.
   - if no admin account exists yet, one is created using `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env` (defaults: `admin` / `admin123`). **Change these in `.env` before running it anywhere but your own machine**, and consider changing the password after your first login since there's currently no "change password" screen — you'd update it by editing the `Admin` document directly in MongoDB (hash a new password with bcrypt) or by dropping the `admins` collection so it reseeds.
3. **Open the app** — the backend also serves the frontend as static files, so once it's running, just visit:
   ```
   http://localhost:5000
   ```
   You don't need a separate frontend server; all frontend pages are served from the same origin as the API, which avoids any CORS setup.

   Visiting `/bookings.html` without being logged in redirects to `/login.html`. Log in with the admin credentials from `.env` to get a session (a JWT stored in the browser, valid for 4 hours).

## API endpoints

| Method | Path                        | Auth required | Purpose                                  |
|--------|-----------------------------|:---:|-------------------------------------------|
| POST   | `/api/auth/login`            |  | Log in, returns a JWT                    |
| GET    | `/api/movies`                |  | List all movies                          |
| GET    | `/api/movies/:id`             |  | Get one movie                            |
| POST   | `/api/movies`                | ✅ | Add a movie                              |
| DELETE | `/api/movies/:id`             | ✅ | Delete a movie                           |
| GET    | `/api/bookings`               | ✅ | List all bookings                        |
| GET    | `/api/bookings/taken-seats`   |  | Seats already booked for a showing (`?movieId=&date=&time=`) |
| POST   | `/api/bookings`               |  | Create a booking                         |

Protected routes expect `Authorization: Bearer <token>`. The frontend handles this automatically once you're logged in via `login.html` — the token is kept in the browser's `localStorage` and attached to every admin request; if it's missing or expired, the admin page redirects back to the login screen.

The server also re-checks seat availability on `POST /api/bookings`, so two people can't book the same seat for the same showing at once — the second request gets a `409` and the frontend refreshes the seat map automatically.

## Running the tests

Tests use `jest` + `supertest` and run against a **separate database** (`booking_management_test` by default), so running them never touches the movies or bookings you see in the running app. They need your local MongoDB to be running (the same one from the setup steps above), but no other configuration.

```bash
cd backend
npm install   # pulls in jest and supertest if you haven't already
npm test
```

This covers:
- **`tests/movies.test.js`** — listing movies, and that adding/deleting a movie is blocked without a valid admin token
- **`tests/auth.test.js`** — login with correct/incorrect/missing credentials
- **`tests/booking.test.js`** — creating a booking, rejecting one for a missing movie or missing fields, blocking a double-booked seat (the `409` conflict case), and that `/api/bookings` is admin-only

If you want the test database to live somewhere else (e.g. a separate Atlas cluster), set `MONGO_URI_TEST` before running `npm test`.

## Status

- ✅ Phase 1 — Frontend
- ✅ Phase 2 — Backend + database
- ✅ Phase 3 — Testing
- ⬜ Phase 4 — GitHub repository (in progress — see below)
- ⬜ Phase 5 — Jenkins pipeline
- ⬜ Phase 6 — Docker
- ⬜ Phase 7 — Deployment
- ⬜ Phase 8 — Ansible automation
- ⬜ Phase 9 — Monitoring
- ⬜ Phase 10 — Final report + methodology diagram + viva prep
