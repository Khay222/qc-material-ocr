# DHL ScanGuard: Material-to-Material Scan Validation Workstation

An industrial-grade, modern web application designed for logistics warehouse packing stations, assembly lines, and quality assurance workflows. Built with DHL visual identity, this workstation enables high-speed, continuous material-to-material barcode verification.

## Features

- **Continuous 50-Cycle Batch Verification**:
  - The operator enters the **Batch Number** and **Target Qty** (e.g., 50).
  - During the entire cycle of 50 scans, the Batch and Qty columns remain locked and displayed at all times.
  - Live progress ring and bar showing real-time verified counts (`N / 50`) and completion percentage.
- **Automated Hands-Free Scanning Workflow**:
  - **Auto-Advance**: Scanning Material 1 barcode automatically focuses on Material 2.
  - **Auto-Validate**: Scanning Material 2 barcode automatically executes instantaneous comparison without requiring manual button clicks.
- **Loud Mismatch Alarm & High-Visibility Red Alert**:
  - Synthesized emergency siren (Web Audio API) triggers on discrepancies between Material 1 and Material 2.
  - High-contrast red modal highlights mismatched characters side-by-side.
  - Quick **Edit / Re-scan** button (`[Enter]` or `[F2]`) silences the alarm and resets focus to allow the operator to correct the barcode without corrupting batch progress.
- **Batch Completion Celebration**:
  - Upon reaching the 50th verified scan (or configured target), a vibrant green completion modal appears with confetti and celebratory chime.
  - Summary metrics display total verified units, error count intercepted, and operator timestamp.
- **Scan History & CSV Export**:
  - Full audit logging backed by **Netlify Database (managed Postgres)** via Drizzle ORM.
  - Download individual batch reports or consolidated CSV records.
- **Operator Authentication**:
  - Sign-in and account registration dialog on the main navigation bar.
  - Quick 1-click Demo Sign In option for instant testing without manual registration.
- **Camera Barcode Scanner Support**:
  - Onboard camera viewfinder modal for testing or operating with mobile phones, tablets, or webcams.
  - Built-in simulation tools to test matching and mismatch flows with zero physical hardware.
- **Design & Theme**:
  - DHL Express Yellow (`#FFCC00`), DHL Red (`#D40511`), and charcoal industrial styling.
  - 100% English user interface.

## Tech Stack

- **Frontend**: React 19, TanStack Start, TanStack Router, Tailwind CSS 4, Lucide Icons, Canvas Confetti.
- **Audio Synthesis**: Native HTML5 Web Audio API multi-oscillator synthesizer (no external audio assets).
- **Backend**: Netlify Functions (`.mts`) for Auth, Batches, Scans, and CSV exports.
- **Database**: Netlify Database (Postgres) with Drizzle ORM and automatic schema migrations.

## Getting Started Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server using Netlify CLI:
   ```bash
   netlify dev --port 8889
   ```

3. Open your browser at `http://localhost:8889` to access the workstation.
