# Small, production-focused Node image
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies first, in their own layer, so Docker can
# reuse this layer on rebuilds unless package.json/package-lock.json change
# (much faster iteration than reinstalling on every code edit).
COPY backend/package*.json ./backend/
RUN npm ci --omit=dev --prefix backend

# Now copy the actual source: the backend app, and the frontend static files
# that backend/server.js serves via express.static(path.join(__dirname, '../frontend')).
COPY backend/ ./backend/
COPY frontend/ ./frontend/

WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "server.js"]
