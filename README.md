# Smart Rural Civic Intelligence System (SRCI)
### *AI-Powered Rural Civic Governance & Long-Term Village Memory*

[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-v4.19-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()

---

## 1. Project Overview & Patent-Oriented Innovation

**Smart Rural Civic Intelligence System (SRCI)** is an advanced, full-stack civic governance platform developed for rural communities, Gram Panchayats, and civic administration. Unlike conventional complaint-ticketing systems that treat issues as static, isolated tickets, SRCI implements a **closed-loop intelligence cycle**:

```
REPORT (Voice/Photo/GPS in Marathi/Hindi/English)
  │
  ▼
EVIDENCE RELIABILITY CHECK (0–100 Score & Adaptive Verification Path)
  │
  ▼
DYNAMIC PRIORITY ENGINE (Multi-factor: Severity, Wait-time, Proximity to Schools/Hospitals)
  │
  ▼
WORKER LIFECYCLE DISPATCH & AUDIT (Start Work -> Progress Proof -> Completion Proof)
  │
  ▼
EVOLVING ISSUE HISTORY (Permanent Event Trail)
  │
  ▼
SPATIAL & SEASONAL RECURRENCE PROFILING (Monsoon/Summer Spikes, Chronic Hotspots)
  │
  ▼
PROBABLE ROOT CAUSE ENGINE (Hypotheses with Confidence % & Field Observations)
  │
  ▼
PREVENTIVE ACTION FORMULATION (Infrastructure Recommendations)
  │
  ▼
PREVENTIVE EFFECTIVENESS LEARNING (Pre vs Post Complaint Reduction %)
  │
  ▼
VILLAGE DIGITAL MEMORY (Long-Term Institutional Knowledge Repository)
```

---

## 2. Multi-Role Governance Architecture

1. **Citizen**:
   - Multilingual voice complaint dictation (Marathi, Hindi, English via Web Speech Recognition).
   - Multi-photo upload with immediate visual validation.
   - Interactive OpenStreetMap & GPS pinpointing.
   - Public community validation (corroborate issues, flag persistence, or verify resolution).
   - Real-time tracking of issue evolution and worker completion proofs.

2. **Gram Panchayat Admin (Sarpanch / Gram Sevak)**:
   - Real-time KPI control center & Recharts analytics.
   - Interactive GIS Leaflet map with category-coded pins & hotspot clustering.
   - All-issues management table with advanced multi-parameter filtering & sorting.
   - Field worker management and dispatching.
   - Dedicated **Village Digital Memory** dashboard.
   - Preventive action planner and empirical effectiveness monitor.

3. **Field Worker**:
   - Dedicated field task dashboard showing assigned work orders.
   - On-site status updates ("Start Work" transitions status to `UNDER ACTION`).
   - Progress notes and completion photographic evidence submission.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom luminous ambient glassmorphism
- **Routing**: React Router v6
- **Multilingualization**: React i18next (`en`, `mr`, `hi`) with persistent toggle
- **Charts**: Recharts (Monthly trends, Categories, Statuses, Priorities, Recurrence)
- **Maps**: Leaflet + React-Leaflet + OpenStreetMap
- **Icons**: Lucide React
- **Voice**: Web Speech Recognition API with simulated graceful fallback

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB & Mongoose
- **Authentication**: JWT & bcryptjs password hashing
- **Media Storage**: Cloudinary with automatic local disk storage fallback
- **Testing**: Jest unit testing suite

---

## 4. Default Demo Credentials (1-Click Test Login Available)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `krishna@gmail.com` | `Sgi@5555` | Krishna (Gram Sevak Admin) |
| **Field Worker** | `kd@gmail.com` | `Sgi@5555` | KD (Field Worker Lead) |
| **Citizen 1** | `citizen1@example.com` | `citizen123` | Aarav Kumar |
| **Citizen 2** | `citizen2@example.com` | `citizen123` | Sunita Gaikwad (Marathi) |

*(A **1-Click Demo Role Switcher** is also available directly in the top navigation bar for zero-typing evaluation).*

---

## 5. Getting Started & Running Locally

### Step 1: Clone & Install Dependencies
```bash
# Install root, backend, and frontend packages
npm run install-all
```
*(Or navigate to `backend/` and `frontend/` separately and run `npm install`).*

### Step 2: Configure Environment Variables
Backend environment configuration is located in `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/srci_db
JWT_SECRET=srci_jwt_secret_production_ready_rural_intelligence_2025
NODE_ENV=development

# Cloudinary (Optional - local disk upload fallback works out of the box)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Step 3: Seed the Database
Populate 1 Admin, 3 Workers, 10 Citizens, 32+ realistic village issues, 5 Digital Memory hotspot profiles, and preventive action effectiveness records:
```bash
cd backend
npm run seed
```

### Step 4: Run Backend & Frontend Servers
In two separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Server will start on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Vite will launch on http://localhost:5173
```

---

## 6. Running Automated Tests

To run the unit test suite verifying all 6 core intelligence engines:
```bash
cd backend
npm test
```
**Tests Covered:**
- `PriorityService`: Critical multi-factor weighting vs low-severity baseline.
- `EvidenceReliabilityService`: Score (0–100) & adaptive verification routing.
- `RecurrenceEngine`: Haversine spatial clustering (<300m) & seasonal monsoon weighting.
- `RootCauseService`: Ranked probabilistic hypotheses with confidence percentages.
- `PreventiveRecommendationService`: Actionable infrastructure recommendations per category.
- `PreventiveEffectivenessService`: Pre- vs post-intervention complaint reduction scoring.

---

## 7. REST API Endpoints Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register citizen, worker, or admin |
| `POST` | `/api/auth/login` | Public | Login & retrieve JWT token |
| `GET` | `/api/auth/me` | Private | Retrieve current user profile |
| `POST` | `/api/issues` | Private | Create issue with photos, voice, GPS |
| `GET` | `/api/issues` | Public | List issues with multi-filter query |
| `GET` | `/api/issues/:id` | Public | Full issue details, timeline & history |
| `PUT` | `/api/issues/:id/status` | Private | Transition issue status in lifecycle |
| `POST` | `/api/issues/:id/validate` | Private | Community validation vote |
| `GET` | `/api/admin/dashboard` | Admin | Real-time KPIs, Recharts data & alerts |
| `PUT` | `/api/admin/assign-worker/:id` | Admin | Assign worker lead to issue |
| `GET` | `/api/workers/assigned` | Worker | Worker assigned tasks feed |
| `PUT` | `/api/workers/issues/:id/progress` | Worker | Add progress notes & start work |
| `POST` | `/api/workers/issues/:id/completion-evidence` | Worker | Submit completion proof & images |
| `GET` | `/api/village-memory` | Public | Village Digital Memory records |
| `GET` | `/api/prevention/recommendations` | Admin | AI preventive recommendations |
| `POST` | `/api/prevention/action` | Admin | Record preventive action plan |
| `GET` | `/api/prevention/effectiveness/:id` | Admin | Measure post-action reduction % |
| `GET` | `/api/notifications` | Private | In-app user & role notifications |
