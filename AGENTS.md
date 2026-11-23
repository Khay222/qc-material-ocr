# AGENTS.md

This document provides an overview of the DHL ScanGuard Material-to-Material Scan Validation project structure for AI agents and developers.

## Project Overview

DHL ScanGuard is a high-reliability material validation workstation web application for logistics warehouse facilities. It coordinates continuous 1-to-1 barcode scanning against batch target quantities (e.g. 50 cycles), auto-advances inputs, triggers loud audio alarm sirens and red alerts on material discrepancies, and records audit logs into a Netlify Database (managed Postgres) with CSV export capabilities.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React 19) + TanStack Router |
| Styling | Tailwind CSS 4 with DHL Brand Tokens (`#FFCC00`, `#D40511`, `#1A1A1A`) |
| Audio Engine | HTML5 Web Audio API multi-oscillator synthesized alarms |
| Backend APIs | Netlify Functions (`.mts`) under `netlify/functions/` |
| Database & ORM | Netlify Database (managed Postgres) with Drizzle ORM (`@beta`) |
| Migrations | `netlify/database/migrations/` generated via `drizzle-kit generate` |
| Build Tool | Vite 7 |

## Key Directories and Files

```
├── db/
│   ├── index.ts                 # Drizzle Netlify Database client initialization
│   └── schema.ts                # Drizzle schema (users, batches, scan_items)
├── netlify/
│   ├── database/migrations/     # SQL migration files generated via drizzle-kit
│   └── functions/
│       ├── api-auth.mts         # User login, registration, and demo session
│       ├── api-batches.mts      # Batch listing, creation, and status updates
│       ├── api-scans.mts        # Real-time scan pair validation & counter updates
│       └── api-export.mts       # CSV report generator (RFC 4180 format)
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx        # Login & user registration modal
│   │   ├── CameraScannerModal.tsx # Webcam/device camera barcode reader modal
│   │   ├── CompletionModal.tsx  # 50/50 green completion modal with confetti
│   │   ├── Header.tsx           # DHL branded header with audio mute & auth status
│   │   ├── HistoryView.tsx      # Historical batches and scan item audit table
│   │   ├── MismatchModal.tsx    # High-gain red discrepancy alert modal
│   │   └── Workstation.tsx      # Primary scanning station (Batch, Qty, Mat 1, Mat 2)
│   ├── routes/
│   │   ├── __root.tsx           # Root HTML layout with metadata
│   │   └── index.tsx            # Main application workstation container
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces for User, Batch, ScanItem
│   ├── utils/
│   │   └── audio.ts             # Web Audio API siren, chime, and fanfare generator
│   ├── router.tsx               # TanStack Router instance
│   ├── routeTree.gen.ts         # Generated route tree
│   └── styles.css               # Global styles, animations, and DHL styling
├── drizzle.config.ts            # Drizzle Kit configuration pointing to migrations
├── netlify.toml                 # Netlify deploy configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # Project documentation
```

## Architectural & Non-Obvious Decisions

1. **Auto-Enter & Hands-Free Scanning Logic**:
   - In industrial warehouse environments, barcode scanner guns emit an `Enter` keystroke (KeyCode 13) immediately after barcode capture.
   - When `Material 1` receives `Enter`, the workstation stores the value, marks it visually as locked, and shifts focus directly to `Material 2`.
   - When `Material 2` receives `Enter`, the workstation triggers `handleValidatePair()` immediately without requiring a physical mouse click on a "Validate" button.
   - If matched: inputs clear and focus snaps back to `Material 1` instantly.
   - If mismatched: an emergency alarm sounds, the red modal opens, and pressing `[Enter]` or clicking "Edit / Re-scan" resets focus to allow the operator to correct the barcode without corrupting the batch counter.

2. **Database Integration**:
   - Uses `@netlify/database` with `drizzle-orm@beta` and `drizzle-kit@beta` as required by the `netlify-database` skill.
   - Schema defines 3 tables: `users`, `batches`, and `scan_items`.
   - Migrations reside in `netlify/database/migrations/` and are automatically applied by the Netlify platform during deploy.
   - For environments where serverless endpoints are warming up, state transitions are mirrored in React state and `localStorage` so the workstation remains 100% operational offline or during network latency.

3. **Audio Synthesis via Web Audio API**:
   - Relies on in-browser Web Audio oscillators (`playLoudAlarm()`, `playMatchBeep()`, `playSuccessFanfare()`) rather than remote MP3 files. This eliminates network dependencies, CORS errors, and audio asset loading delays.
