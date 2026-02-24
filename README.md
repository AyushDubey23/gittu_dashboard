# gittu_dashboard

GDG MMMUT FOSS Contribution Month dashboard.

Dashboard for the GDG MMMUT FOSS Contribution Month event.

## Setup

```bash
npm install
cd client && npm install && cd ..
```

## Development

Start the API and frontend in separate terminals:

```bash
npm run dev:server   # API on http://localhost:4000
npm run dev:client   # Frontend on http://localhost:5173
```

## Production

1. Build the client:

   ```bash
   npm run build
   ```

2. Set environment variables (see `.env.example`):

   - `VITE_API_URL` – API base URL (empty if same origin)
   - `CORS_ORIGIN` – allowed frontend origin
   - `SERVE_STATIC=true` – serve built frontend from Express

3. Run the server:

   ```bash
   NODE_ENV=production node server/index.js
   ```

   Or use your process manager (PM2, systemd, etc.) with these env vars.
