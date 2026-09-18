# CRITICAL RULES - MUST FOLLOW

## PROJECT

- Detecto — full-stack YOLOv8 person detection & counting system.
- Backend: Python FastAPI + SQLAlchemy ORM (SQLite). Frontend: Vite + React 19 (JSX) + Tailwind CSS v4.
- Detection via Ultralytics YOLOv8n; results are annotated (bounding boxes) and every detection is persisted to SQLite.
- No authentication anywhere — the app is a public demo.

## STRUCTURE

Backend (`backend/` is a Python package — commands run from the repo root):
- `backend/main.py` — FastAPI app, CORS, router registration
- `backend/config.py` — env loading + path resolution
- `backend/routes/detect.py` — `POST /detect` (persisting image inference) + `POST /detect/live` (webcam: tracking, zone alerts, no persistence)
- `backend/routes/history.py` — `GET /history`, `GET /history/export` (CSV), `GET /stats`, `POST /reset`
- `backend/models/record.py` — SQLAlchemy `DetectionRecord` model + engine/session (SQLite)
- `backend/models/schemas.py` — Pydantic response DTOs
- `backend/utils/preprocessing.py` — decode + resize image to 640×640
- `backend/utils/tracker.py` — dependency-free `CentroidTracker` (stable IDs + motion trails across live frames)
- `backend/scratch_detect.py` — standalone YOLO script (person detection on samples)
- `backend/samples/` — sample test images (frame1–3.jpg)
- `backend/yolov8n.pt` — model weights (auto-downloaded on first run if absent)
- `backend/requirements.txt` — pip dependencies
- `backend/venv/` — local virtualenv (gitignored)

Frontend (all commands run inside `frontend/`):
- `frontend/src/App.jsx` — `BrowserRouter` routes + `<main>` wrapper
- `frontend/src/pages/DetectionView.jsx` — image upload + detection results + live webcam tab (route `/`)
- `frontend/src/pages/HistoryView.jsx` — stats panel, history table, min-confidence filter, CSV export, reset (route `/history`)
- `frontend/src/components/Navbar.jsx` — top nav with `NavLink` active states
- `frontend/src/components/StatsCard.jsx` — label/value stat card
- `frontend/src/components/LiveView.jsx` — webcam loop, zone drawing, alert banner, tracking trail display
- `frontend/src/lib/api.js` — axios API client + `useMock` flag; every request goes through here
- `frontend/src/lib/mock.js` — mock data generators for all API calls (used when `VITE_USE_MOCK=true`)
- `frontend/src/main.jsx` — React root (imports only `index.css`)
- `frontend/src/index.css` — `@theme` tokens (palette + font families) and `@layer components` recipes (`.sheet`, `.btn-*`, `.monitor`, `.field`, `.pill-signal`, `.badge-mock`, `.scanline`, `.rec-dot`)
- `frontend/src/App.css` — leftover Vite scaffold, NOT imported anywhere — never use it
- `frontend/vite.config.js` — `react()` + `tailwindcss()` plugins
- `frontend/public/samples/` — demo images served by the app
- `frontend/eslint.config.js` — ESLint flat config
- `frontend/vercel.json` — SPA rewrite for static hosting

## ENVIRONMENT

Root `.env` (read by `backend/config.py` via python-dotenv):
- `MODEL_PATH` — YOLO weights path (default: `backend/yolov8n.pt`)
- `CONFIDENCE_THRESHOLD` — detection confidence (default: `0.5`)
- `DB_PATH` — SQLite file (default: `detections.db` at repo root)
- `FRONTEND_ORIGINS` — comma-separated CORS allowlist (default: `http://localhost:5173`)

Frontend `frontend/.env`:
- `VITE_API_URL` — backend base URL (default: `http://localhost:8000`)
- `VITE_USE_MOCK` — `"true"` runs the whole UI on mock data with no backend

## DEPLOYMENT

- Full step-by-step walkthrough + cost/troubleshooting breakdown: `HOSTING.md` at repo root
- Frontend: Vite static build → Vercel; `frontend/vercel.json` rewrites all paths to `index.html` for SPA routing
- Backend: `render.yaml` at repo root (Render web service, Python runtime, `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`); the committed `render.yaml` uses a persistent disk at `/var/data` and therefore requires a paid plan — free-tier deploys must drop the disk block and use a relative `DB_PATH`
- Keep backend at 1 instance: `CentroidTracker` state is in-process and SQLite is single-writer
- Set `FRONTEND_ORIGINS` on the deployed backend to include the real Vercel domain (CORS)
- Set `VITE_API_URL` in Vercel to the deployed backend URL (build-time env)

## COMMANDS

- Backend: `source backend/venv/bin/activate && uvicorn backend.main:app --reload --port 8000`
- Frontend: `npm run dev` (dev server), `npm run lint`, `npm run build` (from `frontend/`)
- Backend has NO lint or test setup — verify changes manually (curl/browser against `/detect`, `/history`)

## RESPONSES

- Keep responses concise and to the point - unless the user asks otherwise
- Don't re-explain code you just wrote; summarize the change in 1-3 lines

## PLANNING MODE

- Always ask clarifying questions before assuming design, content, or scope
- Never assume tech stack or add new dependencies without asking (e.g. don't add auth, ORMs, DBs, or icon libraries casually)
- Use deep-dive sub-agents only for genuinely non-trivial research (new feature areas, model/performance work) — skip them for small, well-scoped changes to save tokens
- For small fixes (bug fixes, copy changes, styling tweaks), skip planning ceremony and just implement

## CHANGE / EDIT MODE

- For small, well-scoped changes, implement directly — sub-agent coordination overhead isn't worth it on a project this size
- Reserve sub-agents for larger parallelizable work (e.g. simultaneous frontend+backend changes)
- Use the best model for the task - premium models for complex logic (model serving, data flow), mid-tier for docs/content/styling
- After completing any frontend feature or fix, run: `npm run lint` and `npm run build` (in `frontend/`)
- Never leave `console.log` debugging statements in committed code

## SECURITY

- No credentials, tokens, or auth exist in this project — don't add them without asking
- Keep CORS scoped to the actual frontend origin (default: `http://localhost:5173`), not wide open
- No hardcoded config — use the root `.env` consumed by `backend/config.py`
- Don't log raw upload bytes or dump large base64 payloads in dev output

## API CONVENTIONS

- Frontend base URL comes from `import.meta.env.VITE_API_URL || "http://localhost:8000"` (the `API` const pattern in `DetectionView.jsx` / `HistoryView.jsx`) — don't duplicate or hardcode other URLs; all requests go through `frontend/src/lib/api.js`
- `POST /detect` takes `multipart/form-data` field `file` (JPEG/PNG); any other type → `400`
- `POST /detect/live` — same `file` field, never persists; query params `zone` = `x1,y1,x2,y2` in 640×640 space, `alert_threshold` (int, people in zone that triggers `zone_alert`); response adds `zone_count`, `zone_alert`, and `track_id` on each detection
- Tracking (stable IDs + green trails drawn server-side) comes from the singleton `CentroidTracker` in `backend/utils/tracker.py` — state lives across `/detect/live` calls
- `annotated_image_b64` is a bare base64 JPEG — the frontend prepends `data:image/jpeg;base64,` (or uses `annotatedImage()` from `./lib/api.js`)
- `GET /history` support: `min_confidence`, `since` (ISO), `limit` query params; rows use SQLite integer `id` and ISO timestamps
- `GET /history/export` — same params, returns `text/csv` with `Content-Disposition: attachment`
- `GET /stats` — returns `total_detections`, `total_people`, `avg_confidence`, `avg_inference_time_ms`, `detections_last_hour`, `per_hour` (24h buckets), `busiest_hour`
- `GET /history` rows keyed by `id` (not `_id`)

## TESTING

- No automated tests exist (backend or frontend) — don't assume a runner is present
- Never assume a change works — test it, at least manually via curl/browser
- If a change needs real test coverage, ask the user whether to add a framework first

## UI DESIGN

- Always follow the UI design system when creating or reviewing components or pages
- Design System: @DESIGN.md
- The system is a light "vision sheet" identity (cool pale-blue paper, Space Grotesk + IBM Plex Mono, phosphor-green accent matching the YOLO boxes) — follow it and @DESIGN.md precisely; do not introduce a different design system without asking
- Keep this file and @DESIGN.md in sync with the actual codebase — update them as part of any change that alters stack, structure, or conventions, don't let them drift