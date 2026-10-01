# IslaSafe Admin Web App

The IslaSafe Admin Web App is a React and TypeScript dashboard for monitoring SOS requests, incidents, hazard-map information, evacuation centers, advisories, residents, and weather conditions.

## Requirements

Install the following before running the frontend:

- [Node.js](https://nodejs.org/) 20 or later
- npm (included with Node.js)

## Install dependencies

Open a terminal in the `frontend` folder, then install the packages declared in `package.json`:

```bash
npm install
```

This installs the main application dependencies:

- React and React DOM
- Vite and TypeScript
- Tailwind CSS
- MapLibre GL JS for interactive map views
- Lucide React for icons
- Oxlint for linting

## Environment configuration

Copy `.env.example` to `.env` before connecting the frontend to external services. The local `.env` file is ignored by Git.

```powershell
Copy-Item .env.example .env
```

Set the required values in `.env`:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL for the backend API. |
| `VITE_API_TIMEOUT_MS` | API request timeout in milliseconds. |
| `VITE_MAP_TILE_URL` | Primary/satellite map tile URL. |
| `VITE_MAP_STREETS_TILE_URL` | Street-map tile URL used by location detail maps. |
| `VITE_MAP_API_KEY` | Browser-restricted map key, when required by the chosen provider. |
| `VITE_MAP_ATTRIBUTION` | Attribution for the primary map tiles. |
| `VITE_MAP_STREETS_ATTRIBUTION` | Attribution for street-map tiles. |
| `VITE_ENABLE_MOCK_DATA` | `false` = real backend auth + live SOS polling. `true` = standalone mock UI (no backend needed). |

All frontend configuration is read through `src/config/environment.ts`. Do not place private backend secrets in `VITE_*` variables because Vite exposes them in the browser bundle.

## Run the app locally

From the `frontend` folder, start the Vite development server:

```bash
npm run dev
```

Vite will print the local URL in the terminal, typically `http://localhost:5173`.

If PowerShell prevents `npm` scripts from running, use the Windows command wrapper instead:

```powershell
npm.cmd run dev
```

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the local development server with hot reload. |
| `npm run build` | Type-checks the project and creates a production build in `dist/`. |
| `npm run preview` | Serves the latest production build locally. |
| `npm run lint` | Runs Oxlint checks. |

For PowerShell environments with script-execution restrictions, replace `npm` with `npm.cmd` in the commands above.

## Authentication and roles

With `VITE_ENABLE_MOCK_DATA=false` the panel authenticates against the Laravel backend. From the `backend` folder, run `php artisan serve` (listens on `http://localhost:8000`) and seed once:

```bash
php artisan migrate --seed
```

Seeded accounts:

| Email | Role | Password | Access |
| --- | --- | --- | --- |
| `admin@islasafe.test` | `admin` | `TempAdmin123!` (temporary) | Every page, SOS status changes |
| `camp@islasafe.test` | `campmanager` | `password` | Operations pages + SOS status changes (no Residents, no Settings) |
| `resident@islasafe.test` | `residents` | `password` | Hazard Map, Evacuation Centers, MDRRMO Link / AWS, Advisories |

The Sign up tab registers a real account with the least-privileged `residents` role. Sessions persist in `localStorage`; the sidebar sign-out button revokes the token through the API. Role boundaries are enforced on the server as well (`role:` middleware in `backend/routes/api.php`).

## SOS alert behavior

While signed in as `admin` or `campmanager`, the panel polls `GET /api/sos-requests` every 5 seconds. Any request that appears after the initial load switches on the full-screen red SOS flash with the acknowledgment banner. Tapping **SOS Management** in the sidebar stops it.

To trigger an incoming SOS, use the **Simulate incoming SOS** button on the SOS Management page, or post directly:

```bash
curl -X POST http://localhost:8000/api/sos-requests -H "Content-Type: application/json" -H "Accept: application/json" -d '{"name":"Juan Dela Cruz","contact":"0917-000-0000","location":"Purok 6, Pitogo","latitude":10.121,"longitude":124.558,"type":"Emergency assistance","category":"Medical","priority":"High","description":"Need help"}'
```

`POST /api/sos-requests` is intentionally public so resident devices can always report an emergency. Listing and status updates require a token.

## Project structure

```text
frontend/
├── src/
│   ├── components/        # Reusable UI components (layout, dialogs, cards, map controls)
│   ├── pages/             # One file per screen (Dashboard, Hazard Map, SOS, ...)
│   ├── hooks/             # useAuth, useSosRequests (session, polling, alarm triggers)
│   ├── data/              # Mock records and map layer definitions
│   ├── utils/             # Shared helpers (api client, sos mapper, maplibre, status tones)
│   ├── config/            # Environment configuration and role/page permissions
│   ├── assets/            # Static frontend assets
│   ├── App.tsx            # Application entry layout and page routing
│   ├── index.css          # Global styles
│   └── main.tsx           # React bootstrap file
├── package.json           # Scripts and frontend dependencies
└── vite.config.ts         # Vite configuration
```
