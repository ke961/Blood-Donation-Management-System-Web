# 🩸 LifeFlow — Emergency Blood Donation Management System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%208-blue.svg)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)
![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20SQLAlchemy-003B57.svg)
![Real‑Time](https://img.shields.io/badge/Real--Time-WebSockets-ff6b6b.svg)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

> **LifeFlow** is a modern, full-stack emergency blood donation management platform that connects voluntary blood donors, patients requiring urgent transfusions, hospital care centers, and administrators — all updated **in real time** via WebSockets.

---

## 🌐 Live Deployments

| Service | URL |
|:--------|:----|
| 📱 **Frontend** (Vercel) | [blood-donation-management-system-we.vercel.app](https://blood-donation-management-system-we.vercel.app/) |
| ⚡ **Backend API** (Render) | [blood-donation-management-system-web.onrender.com](https://blood-donation-management-system-web.onrender.com/) |
| 📖 **Swagger Docs** | [/docs](https://blood-donation-management-system-web.onrender.com/docs) |

---

## ⚡ Real-Time Architecture

Every dashboard is connected to the backend via **WebSockets**. When any user performs an action — submitting a blood request, volunteering as a donor, or updating a status — all connected clients receive the update **instantly**, with no page refresh required.

```
┌─────────────┐                              ┌──────────────────┐
│  Patient     │◄─── WebSocket (ws/wss) ────►│                  │
├─────────────┤                              │   FastAPI /ws    │
│  Donor       │◄─── WebSocket (ws/wss) ────►│   endpoint       │
├─────────────┤                              │                  │
│  Hospital    │◄─── WebSocket (ws/wss) ────►│  ConnectionMgr   │
├─────────────┤                              │  (broadcast)     │
│  Admin       │◄─── WebSocket (ws/wss) ────►│                  │
└─────────────┘                              └────────┬─────────┘
                                                      │
                                              ┌───────┴─────────┐
                                              │  API Routers     │
                                              │  patient · donor │
                                              │  hospital · admin│
                                              └─────────────────┘
```

**Broadcast Events:** `request_created` · `request_updated` · `request_deleted` · `donation_created` · `donation_status_changed` · `donor_availability_changed` · `user_updated` · `user_deleted` · `profile_updated`

---

## 🎯 User Portals & Features

The platform provides four role-gated dashboards:

### 🛡️ Admin Portal
- **Real-time Analytics** — Total users, donors, patients, donation stats, and request statuses (`Pending`, `Approved`, `Assigned`, `Completed`).
- **User Management** — Role switching (`Admin`, `Donor`, `Patient`, `Hospital`) and account deletion with cascade handling.
- **Request Management** — Create, monitor, update, and delete all system blood requests.
- **Donation Audit** — Monitor volunteer commitments and verify completed transfusions.

### 🏥 Hospital Portal
- **Hospital Dashboard** — View hospital-specific active requests, pending/assigned/completed statistics.
- **Emergency Requests** — Create official hospital blood requests with departments, units, contact hotlines, and urgency levels.
- **Patient Queue** — Review all system emergency requests. One-click **"Accept & Approve"** or **"Fulfill Blood"** actions.
- **Hospital Directory** — Search partner hospitals with live **"⚡ Active Emergency Blood Needs"** on each card.
- **Donor Network** — Search and filter available registered donors for donation drives.

### ❤️ Donor Portal
- **Availability Toggle** — One-click switch between `Available to Donate` and `Currently Unavailable`.
- **Smart Matching** — Automatic blood group matching highlight (`⭐ Matches Your Blood Group`).
- **Volunteer Workflow** — Single-click commitment for active emergency requests.
- **Donation History** — Track past and active donation commitments with status updates.

### 🩸 Patient Portal
- **Emergency Request Submission** — Submit blood requests with hospital name, required blood group, units needed, contact number, and urgency level (`Normal`, `Urgent`, `Critical`).
- **Lifecycle Tracking** — Real-time tracking: `Pending` → `Approved` → `Assigned` → `Completed` with volunteer donor lists.
- **Hospital Directory** — Browse partner hospitals and view their stocked blood groups and active emergency needs.
- **Donor Discovery** — Searchable directory of active donors matching required blood types.

---

## 🔑 Test Credentials

| Role | Email | Password | Portal |
|:-----|:------|:---------|:-------|
| **Admin** | `admin@gmail.com` | `admin123` | `/admin/dashboard` |
| **Donor** | `donor@gmail.com` | `donor123` | `/donor/dashboard` |
| **Patient** | `patient@gmail.com` | `patient123` | `/patient/dashboard` |
| **Hospital** | `hospital@gmail.com` | `hospital123` | `/hospital/dashboard` |

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|:-----------|:--------|
| **React 19 + Vite 8** | UI framework & build tool |
| **React Router DOM v7** | Client-side routing |
| **Axios** | HTTP client with Bearer token interceptor |
| **WebSocket API** | Real-time server connection with auto-reconnect |
| **Vanilla CSS** | Glassmorphic dark theme with design tokens |

### Backend
| Technology | Purpose |
|:-----------|:--------|
| **FastAPI** (Python 3.11) | REST API framework |
| **FastAPI WebSockets** | Real-time bidirectional communication |
| **SQLAlchemy + SQLite** | ORM & database (`blood_donation.db`) |
| **PyJWT (JOSE)** | JWT token authentication |
| **Passlib + bcrypt** | Password hashing |
| **Pydantic v2** | Request/response data validation |

### DevOps & CI/CD
| Technology | Purpose |
|:-----------|:--------|
| **GitHub Actions** | Automated test & deploy pipeline |
| **Vercel** | Frontend SPA hosting |
| **Render** | Backend ASGI server hosting |

---

## 🗄️ Database Schema

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users      │       │  blood_requests   │       │   donations   │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │◄──┐   │ id (PK)          │◄──┐   │ id (PK)      │
│ full_name    │   │   │ patient_id (FK)──┘   │   │ donor_id (FK)│──► users
│ email        │   │   │ patient_name     │   │   │ request_id   │──► blood_requests
│ password     │   │   │ contact_number   │   │   │ donation_date│
│ role         │   │   │ blood_group      │   │   │ status       │
│ phone        │   │   │ hospital         │   │   └──────────────┘
│ blood_group  │   │   │ quantity         │   │
│ gender       │   │   │ urgency          │   │
│ address      │   │   │ status           │   │
│ is_available │   │   │ created_at       │   │
│ created_at   │   │   └──────────────────┘   │
└──────────────┘   └──────────────────────────┘
```

---

## 🔄 CI/CD Pipeline

Automated GitHub Actions pipeline (`.github/workflows/deploy.yml`) runs 4 parallel jobs on push to `main`:

```
               ┌──► 🚀 Deploy Frontend to Vercel
               │
[Test Frontend & Test Backend]
               │
               └──► ⚡ Deploy Backend to Render
```

1. **Test & Build Frontend** — `npm ci` → `npm run build`
2. **Test Backend API** — `pip install -r requirements.txt` → validate FastAPI
3. **Deploy Frontend to Vercel** — Production build via Vercel CLI
4. **Deploy Backend to Render** — Automated deployment trigger

---

## 🚀 Local Setup

### Prerequisites
- **Node.js** v18+ & **npm**
- **Python** v3.11+

### 1. Clone
```bash
git clone https://github.com/ke961/Blood-Donation-Management-System-Web.git
cd Blood-Donation-Management-System-Web
```

### 2. Backend
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
> Backend runs at `http://127.0.0.1:8000` · Swagger Docs at `http://127.0.0.1:8000/docs` · WebSocket at `ws://127.0.0.1:8000/ws`

### 3. Frontend
```bash
# In a new terminal:
cd frontend
npm install
npm run dev
```
> Frontend runs at `http://localhost:5173`

### 4. Test Real-Time
1. Open **two browser tabs** — log in as different roles (e.g., Patient + Donor)
2. Submit a blood request as Patient → it **instantly appears** on the Donor dashboard
3. Volunteer as Donor → the Patient dashboard **instantly updates** the request status

---

## 📂 Project Structure

```
Blood-Donation-Management-System-Web/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app + WebSocket /ws endpoint
│   │   ├── models.py               # SQLAlchemy models (User, BloodRequest, Donation)
│   │   ├── schemas.py              # Pydantic validation schemas
│   │   ├── database.py             # Database engine & session
│   │   ├── auth.py                 # JWT auth & role guards
│   │   ├── websocket_manager.py    # Real-time connection manager & broadcaster
│   │   ├── routers/
│   │   │   ├── auth.py             # Login & Register endpoints
│   │   │   ├── admin.py            # Admin CRUD endpoints
│   │   │   ├── donor.py            # Donor dashboard & volunteer endpoints
│   │   │   ├── patient.py          # Patient request & profile endpoints
│   │   │   └── hospital.py         # Hospital management endpoints
│   │   └── utils/
│   │       └── create_admin.py     # Auto-seed admin account
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Router configuration
│   │   ├── main.jsx                # React entry point
│   │   ├── services/
│   │   │   ├── api.js              # Axios instance with auth interceptor
│   │   │   └── websocket.js        # WebSocket utility with auto-reconnect
│   │   ├── Pages/
│   │   │   ├── Home.jsx            # Public landing page + live emergency queue
│   │   │   ├── Login.jsx           # Authentication page
│   │   │   ├── Register.jsx        # Registration page
│   │   │   ├── DonorDashboard.jsx  # Donor portal
│   │   │   ├── PatientDashboard.jsx # Patient portal
│   │   │   └── HospitalDashboard.jsx # Hospital portal
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx  # Admin portal
│   │   └── components/             # Shared & protected route components
│   └── package.json
├── .github/workflows/deploy.yml    # CI/CD pipeline
├── LICENSE                         # MIT License
├── vercel.json                     # Vercel deployment config
└── README.md
```

---

## 📚 Documentation

- 📑 **[Final Submission Report](FINAL_PROJECT_REPORT.md)** — Complete CSE309 IUB Submission Report
- 👥 **[Users & Personas](feature/PRD-phase/Users)** — User Role Specifications & Access Control Matrix
- 📖 **[User Stories](feature/PRD-phase/User_Stories)** — User Stories for Admin, Donor, and Patient
- 🔄 **[Use Cases](feature/PRD-phase/Use_Cases)** — Use case flows and alternative scenarios
- ✅ **[Acceptance Criteria](feature/PRD-phase/Acceptance_Criteria)** — Given-When-Then BDD specifications
- 🗺️ **[User Journeys](feature/PRD-phase/design_user_journey)** — Flowchart diagrams for user interactions
- 📊 **[Data Flow Diagrams](feature/PRD-phase/Data_Flow_Diagram%20_DFD)** — Level 0 and Level 1 DFD models
- 🗄️ **[ERD](feature/PRD-phase/Design%20Entity%20Relationship%20Diagram%20%28ERD%29)** — Database schema and foreign key relationships

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <strong>Abila Khan</strong>
</p>
