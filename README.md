# 🩸 LifeFlow - Emergency Blood Donation Management System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%208-blue.svg)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)
![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20SQLAlchemy-003B57.svg)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

> **LifeFlow** is a modern, full-stack emergency blood donation management platform built to connect voluntary blood donors, patients requiring urgent transfusions, and hospital administrators in real time.

---

## 🌐 Live Deployments

- 📱 **Frontend Application (Vercel):** [https://blood-donation-management-system-we.vercel.app/](https://blood-donation-management-system-we.vercel.app/)
- ⚡ **Backend API Server (Render):** [https://blood-donation-management-system-web.onrender.com/](https://blood-donation-management-system-web.onrender.com/)
- 📖 **Interactive API Swagger Docs:** [https://blood-donation-management-system-web.onrender.com/docs](https://blood-donation-management-system-web.onrender.com/docs)

---

## 🎯 Key User Portals & Features

The platform provides custom role-gated interfaces for three distinct personas:

### 1. 🛡️ System Administrator (Admin Portal)
- **Real-time Analytics Overview:** Monitor system metrics for total users, registered donors, patient count, donation stats, and blood request statuses (`Pending`, `Approved`, `Assigned`, `Completed`).
- **User Account Management:** Full user account control, including role switching (`Admin`, `Donor`, `Patient`) and account deletion with cascade handling.
- **Emergency Request Management:** Create hospital emergency requests manually and update request fulfillment states.
- **Donation Audit Records:** Monitor donor volunteer commitments and verify completed transfusions.

### 2. ❤️ Voluntary Donor (Donor Portal)
- **Live Availability Toggle:** One-click availability switch (`Available to Donate` vs `Currently Unavailable`).
- **Matched Request Discovery:** Automatic blood group matching highlight (`⭐ Matches Your Blood Group`).
- **Volunteer Workflow:** Single-click volunteer commitment for active hospital requests.
- **Donation History:** Track past and active donation commitments.

### 3. 🩸 Patient Care Hub (Patient Portal)
- **Emergency Request Submission:** Submit blood requests specifying hospital name/address, required blood group, units needed, city, contact number, and urgency level (`Normal`, `Urgent`, `Critical`).
- **Fulfillment Lifecycle Tracking:** Real-time tracking of request status (`Pending` → `Approved` → `Assigned` → `Completed`).
- **Donor Directory:** Searchable directory of active registered donors matching required blood types.

---

## 🔑 Pre-Seeded Test Credentials

| Role | Email | Password | Access / Portal |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `admin123` | System Control (`/admin/dashboard`) |
| **Donor** | `donor@gmail.com` | `donor123` | Voluntary Donor Portal (`/donor/dashboard`) |
| **Patient** | `patient@gmail.com` | `patient123` | Patient Care Hub (`/patient/dashboard`) |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 + Vite 8
- **Routing:** React Router DOM v7
- **HTTP Client:** Axios (configured with Bearer token interceptor)
- **Styling:** Vanilla CSS design tokens (Glassmorphic dark/light theme)

### Backend
- **Framework:** FastAPI (Python 3.11)
- **ORM & Database:** SQLAlchemy with SQLite (`blood_donation.db`)
- **Security & Auth:** PyJWT (JOSE), Passlib (`bcrypt` password hashing), OAuth2 Bearer middleware
- **Data Validation:** Pydantic v2 schemas

### DevOps & CI/CD
- **Automation Pipeline:** GitHub Actions (`.github/workflows/deploy.yml`)
- **Cloud Hostings:** Vercel (React SPA Frontend) & Render (FastAPI Backend ASGI)

---

## 🔄 CI/CD Pipeline & GitHub Actions

The repository includes an automated GitHub Actions pipeline (`.github/workflows/deploy.yml`) running 4 parallel jobs on push to `main`:

```text
               ┌──> 🚀 Deploy Frontend to Vercel
               │
[Test Frontend & Test Backend]
               │
               └──> ⚡ Deploy Backend to Render
```

1. **`Test & Build Frontend`**: Installs dependencies (`npm ci`) and builds the React production bundle (`npm run build`).
2. **`Test Backend API`**: Installs Python 3.11 dependencies (`pip install -r requirements.txt`) and validates FastAPI setup.
3. **`Deploy Frontend to Vercel`**: Triggers production build deployment to Vercel.
4. **`Deploy Backend to Render`**: Triggers automated deployment to Render.

---

## 🚀 Local Setup & Development

### Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.11+)

### 1. Clone the Repository
```bash
git clone https://github.com/ke961/Blood-Donation-Management-System-Web.git
cd Blood-Donation-Management-System-Web
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Activate Virtual Environment:
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*Backend server runs at `http://127.0.0.1:8000` | Swagger Docs at `http://127.0.0.1:8000/docs`*

### 3. Frontend Setup
```bash
# In a new terminal window:
cd frontend
npm install
npm run dev
```
*Frontend dev server runs at `http://localhost:5173`*

---

## 📚 Project Documentation & Artifacts

- 📑 **[Final Submission Report](FINAL_PROJECT_REPORT.md):** Complete CSE309 IUB Submission Report
- 👥 **[Users & Personas](feature/PRD-phase/Users):** User Role Specifications & Access Control Matrix
- 📖 **[User Stories](feature/PRD-phase/User_Stories):** User Stories for Admin, Donor, and Patient
- 🔄 **[Use Cases](feature/PRD-phase/Use_Cases):** Use case flows and alternative scenarios
- ✅ **[Acceptance Criteria](feature/PRD-phase/Acceptance_Criteria):** Given-When-Then BDD specifications
- 🗺️ **[User Journeys](feature/PRD-phase/design_user_journey):** Flowchart diagrams for user interactions
- 📊 **[Data Flow Diagrams (DFD)](feature/PRD-phase/Data_Flow_Diagram%20_DFD):** Level 0 and Level 1 DFD models
- 🗄️ **[Entity Relationship Diagram (ERD)](feature/PRD-phase/Design%20Entity%20Relationship%20Diagram%20%28ERD%29):** Database schema and foreign key relationships

---

## 📄 License
This project is licensed under the MIT License.
