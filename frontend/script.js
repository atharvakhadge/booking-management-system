const API_BASE = '/api';
const TOKEN_KEY = 'bms_admin_token';

/* ---------- Admin session ---------- */

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function isLoggedIn() {
  return !!getToken();
}

// Call at the top of any admin-only page. Redirects to login if there's no
// session, and bounces back to that page after a successful login.
function requireAdminSession() {
  if (!isLoggedIn()) {
    const returnTo = encodeURIComponent(window.location.pathname);
    window.location.href = `login.html?redirect=${returnTo}`;
  }
}

/* ---------- API client ---------- */

async function apiRequest(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) {
    // Session expired or was invalidated — send the admin back to log in.
    clearToken();
    window.location.href = 'login.html';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

const api = {
  login: (username, password) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getMovies: () => apiRequest('/movies'),
  getMovie: (id) => apiRequest(`/movies/${id}`),
  addMovie: (movie) => apiRequest('/movies', { method: 'POST', body: JSON.stringify(movie) }),
  deleteMovie: (id) => apiRequest(`/movies/${id}`, { method: 'DELETE' }),
  getBookings: () => apiRequest('/bookings'),
  getTakenSeats: (movieId, date, time) =>
    apiRequest(`/bookings/taken-seats?movieId=${movieId}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`),
  createBooking: (booking) => apiRequest('/bookings', { method: 'POST', body: JSON.stringify(booking) }),
};

/* ---------- Small utilities ---------- */

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function posterVars(hue) {
  return `--p1: hsl(${hue}, 55%, 20%); --p2: hsl(${(hue + 34) % 360}, 62%, 42%);`;
}

function nextDays(count) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      value: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
    });
  }
  return days;
}

function formatDateLabel(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
