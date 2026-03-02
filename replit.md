# Dental Clinic Management System

A full-stack Dental Clinic Management System built with React, Node.js, and SQLite.

## Architecture

### Frontend (React + Vite)
- **Location**: `frontend/`
- **Port**: 5000 (0.0.0.0)
- **Stack**: React 18, TypeScript, Vite, React Router v6, Axios, Lucide Icons
- **Workflow**: "Start application" → `cd frontend && npm run dev`

### Backend (Express.js + SQLite)
- **Location**: `backend/`
- **Port**: 8000 (127.0.0.1)
- **Stack**: Node.js, Express 4, better-sqlite3
- **Workflow**: "Start Backend" → `cd backend && node src/index.js`
- **Database**: `dental_clinic.db` (SQLite, auto-created + seeded on first run)

## Project Structure

```
/
├── frontend/
│   ├── src/
│   │   ├── pages/         # Dashboard, Patients, Appointments, Dentists, Treatments, Invoices
│   │   ├── components/    # Layout, Card, Modal, StatusBadge
│   │   ├── hooks/         # useApi hook + axios instance
│   │   └── types/         # TypeScript type definitions
│   ├── vite.config.ts     # Vite config (host=0.0.0.0, port=5000, proxy to :8000)
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── index.js       # Express app entry point
│   │   ├── db.js          # SQLite setup, init, seed data
│   │   └── routes/        # patients, dentists, appointments, treatments, invoices, dashboard
│   └── package.json
├── dental_clinic.db       # SQLite database (auto-created)
└── replit.md
```

## Features

- **Dashboard**: Stats overview (total patients, today's appointments, pending invoices, monthly revenue), recent and upcoming appointments
- **Patients**: CRUD for patient records (name, email, phone, DOB, address, medical history)
- **Appointments**: Schedule and manage appointments with status tracking (scheduled/completed/cancelled/no-show)
- **Dentists**: Manage dentist profiles with specializations and schedules
- **Treatments**: Catalog of dental treatments with duration and cost
- **Invoices**: Billing management with mark-as-paid functionality

## API

All API endpoints are under `/api/`:
- `GET/POST/PUT/DELETE /api/patients`
- `GET/POST/PUT/DELETE /api/dentists`
- `GET/POST/PUT/DELETE /api/appointments`
- `GET/POST/PUT/DELETE /api/treatments`
- `GET/PATCH /api/invoices`
- `GET /api/dashboard/stats`

The Vite dev server proxies `/api/*` requests to `http://127.0.0.1:8000`.

## Seed Data

On first startup, the backend seeds the database with:
- 3 sample dentists
- 8 sample treatments
- 5 sample patients
- 6 appointments (past, today, upcoming)
- 4 invoices (2 paid, 2 pending)

## Development Notes

- Backend must use `127.0.0.1` (not `localhost`) for IPv4 binding in Node.js 20
- Frontend uses Vite proxy so no CORS issues in development
- SQLite DB file is created at project root as `dental_clinic.db`
