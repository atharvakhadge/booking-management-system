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
├── ansible/
│   ├── inventory         Points at your EC2 instance
│   ├── ansible.cfg
│   └── deploy.yml        Installs Docker, pulls latest code, restarts containers
├── monitoring/
│   ├── docker-compose.monitoring.yml   Prometheus + Grafana + node-exporter + cAdvisor
│   └── prometheus.yml                  What Prometheus scrapes, and how often
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

## Deployment

The app is deployed to a real AWS EC2 instance (Ubuntu, `t3.micro`, free tier, `ap-south-1` / Mumbai region). What's running there right now, done manually:

1. Launched the EC2 instance with a security group allowing SSH (port 22, restricted to a specific IP) and the app itself (port 5000, open to everyone).
2. Installed Docker + the Compose plugin on the instance using Docker's official install script.
3. Cloned this repository directly onto the instance.
4. Ran `docker compose up --build -d` — same `docker-compose.yml` used locally, no changes needed, because the whole point of containerizing in Phase 6 was that it runs identically anywhere.

This manual process is exactly what Phase 8 (Ansible) automates — instead of SSHing in and typing these commands by hand, an Ansible playbook does steps 2–4 on its own.

## Automated redeployment with Ansible

`ansible/deploy.yml` reproduces the manual deployment above: it installs Docker if it's missing, pulls the latest code from GitHub, and runs `docker compose up --build -d`. Run it any time you want to push a new version of the app to the server — no manual SSH steps needed.

Ansible's control machine (the one you run `ansible-playbook` from) needs to be Linux/macOS — it doesn't run natively on Windows. The easiest fix, since Docker Desktop already enabled WSL2 on this machine back in Phase 6, is to use that:

1. Open a WSL terminal (search "Ubuntu" or "WSL" in the Start menu — if nothing shows up, run `wsl --install -d Ubuntu` from PowerShell first, then restart).
2. Install Ansible inside WSL:
   ```bash
   sudo apt update
   sudo apt install -y ansible
   ```
3. Navigate to the `ansible/` folder. Since WSL can see your Windows files under `/mnt/c/...`, if your project is at `C:\Users\DELL\Desktop\booking-management-system`, that's:
   ```bash
   cd /mnt/c/Users/DELL/Desktop/booking-management-system/ansible
   ```
4. Open `inventory` and update the `ansible_ssh_private_key_file` path to wherever your `booking-key.pem` actually lives, using the same `/mnt/c/...` style path.
5. Run the playbook:
   ```bash
   ansible-playbook deploy.yml
   ```

Ansible reports each task as `ok` (nothing needed changing), `changed` (it did something), or `failed`. Re-running it any time after this is safe — most tasks are written to skip work that's already done (that's what "idempotent" means in DevOps terms, worth knowing for your viva), so a re-run mostly just confirms Docker's still installed and pulls whatever's new since the last deploy.

## Monitoring (Prometheus + Grafana)

`monitoring/` runs a separate stack of four containers alongside the app, giving visibility into both the EC2 host and the app's own containers:

- **Prometheus** — polls metrics every 15 seconds and stores them
- **node-exporter** — exposes the EC2 instance's own CPU, memory, disk, and network stats
- **cAdvisor** — exposes per-container stats for everything Docker is running on the host, including `booking-app` and `booking-mongo`
- **Grafana** — the dashboard on top of Prometheus's data

### Running it (on the EC2 instance)

SSH into the server, then from inside `booking-management-system` (pull the latest code first if `monitoring/` isn't there yet — `git pull`):

```bash
cd monitoring
docker compose -f docker-compose.monitoring.yml up -d
```

This is a **separate compose stack** from the main app on purpose — it can be stopped, restarted, or torn down independently without touching `booking-app` or `booking-mongo`.

### Opening the AWS security group for this

Same place as before (EC2 → Security Groups → your instance's group → Inbound rules → Edit), add two more Custom TCP rules, Source: Anywhere:
- Port **3000** (Grafana)
- Port **9090** (Prometheus, optional — lets you view raw scrape targets at `/targets`)

### Setting up the Grafana dashboard

1. Open `http://<your-ec2-ip>:3000` and log in with `admin` / `admin123` (from `docker-compose.monitoring.yml` — change these before running this anywhere but your own machine). It'll prompt you to set a new password on first login; you can skip that for this assignment.
2. Add Prometheus as a data source: **Connections → Data sources → Add data source → Prometheus**. Set the URL to `http://prometheus:9090` (Grafana reaches Prometheus by its container name, since they're on the same Docker network — not `localhost`, that would point at Grafana's own container). Click **Save & test** — it should confirm it can reach Prometheus.
3. Import a ready-made dashboard instead of building one from scratch: **Dashboards → New → Import**, enter dashboard ID **`1860`** ("Node Exporter Full" — a very widely used community dashboard), select your Prometheus data source, click **Import**. You'll immediately get CPU, memory, disk, and network graphs for the EC2 instance.
4. Optionally repeat with dashboard ID **`19908`** for a similar pre-built cAdvisor/container dashboard.

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
- ✅ Phase 7 — Deployment
- ✅ Phase 8 — Ansible automation
- ⬜ Phase 9 — Monitoring (in progress — see below)
- ⬜ Phase 10 — Final report + methodology diagram + viva prep
