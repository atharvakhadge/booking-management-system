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
├── Dockerfile            Builds the backend + serves the frontend as static files
├── docker-compose.yml    Runs the app together with its own MongoDB container
├── .dockerignore
├── Jenkinsfile
└── README.md
```

## Running it with Docker

This is the easiest way to run the whole stack — no local Node.js or MongoDB installation required, since both live inside containers.

1. Install **Docker Desktop** (docker.com/products/docker-desktop), which on Windows also needs WSL2 — the installer prompts you through that if it's missing.
2. From the project root:
   ```bash
   docker compose up --build
   ```
   First run downloads the `mongo:7` image and builds the app image, so it takes a few minutes. Subsequent runs are much faster.
3. Open **http://localhost:5000** — same app, running entirely in containers.

This spins up a **separate, empty MongoDB** inside its own container (data lives in a Docker volume, isolated from any MongoDB you have installed directly on Windows), so it seeds fresh sample movies and a fresh admin account (`admin` / `admin123`) the first time it starts, same as a brand new install. The admin credentials and JWT secret for this containerized version are set directly in `docker-compose.yml` — edit them there before running this anywhere but your own machine.

To stop everything: `docker compose down` (add `-v` if you also want to wipe the database volume and start clean next time).

## Running it locally (without Docker)

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

## Jenkins and Docker together

The `Jenkinsfile` now has a `Build Docker Image` stage after the tests pass, so a green pipeline ends with a `booking-management-system` image sitting in Docker's local image cache on whatever machine runs the build.

One thing worth knowing if you're running Jenkins natively on Windows (as installed in Phase 5): Jenkins runs as a Windows **service**, under the `LocalSystem` account, while Docker Desktop's engine is normally only reachable from your own logged-in user session. This can mean the `Build Docker Image` stage fails with something like `error during connect` even though `docker build` works fine when you run it yourself in PowerShell — that's not a mistake in the Jenkinsfile, it's a real, well-known friction point with Windows + Jenkins-as-a-service + Docker Desktop specifically. It's not something to lose time debugging for this assignment: in a real deployment, Jenkins would typically run on a Linux server (exactly what Phase 7's EC2/VM step sets up) where this isn't an issue at all, since Jenkins and Docker run under the same straightforward permission model. For now, running `docker compose up --build` yourself to demonstrate the container working is the right proof point — mention the Windows/service permission nuance if it comes up in your viva, it's a legitimate real-world detail, not a gap in your work.

## Status

- ✅ Phase 1 — Frontend
- ✅ Phase 2 — Backend + database
- ✅ Phase 3 — Testing
- ✅ Phase 4 — GitHub repository
- ✅ Phase 5 — Jenkins pipeline
- ✅ Phase 6 — Docker
- ⬜ Phase 7 — Deployment
- ⬜ Phase 8 — Ansible automation
- ⬜ Phase 9 — Monitoring
- ⬜ Phase 10 — Final report + methodology diagram + viva prep
