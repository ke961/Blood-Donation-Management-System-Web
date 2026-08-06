# 🩸 LifeFlow - Blood Donation Management System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%208-blue.svg)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

> **LifeFlow** is a modern, full-stack emergency blood donation management platform designed to connect voluntary blood donors, patients in critical need, and hospital administrators in real time.

---

## 🌐 Live Deployments

- 📱 **Frontend Application (Vercel):** [https://blood-donation-management-system-we.vercel.app/](https://blood-donation-management-system-we.vercel.app/)
- ⚡ **Backend API Server (Render):** [https://blood-donation-management-system-web.onrender.com/](https://blood-donation-management-system-web.onrender.com/)
- 📖 **Interactive API Swagger Docs:** [https://blood-donation-management-system-web.onrender.com/docs](https://blood-donation-management-system-web.onrender.com/docs)

---

## 🎯 Key User Roles & Feature Portals

The system provides custom role-gated interfaces for three distinct personas:

### 1. 🛡️ System Administrator (Admin Portal)
- **Real-time Analytics Overview:** View high-level metrics for total users, registered donors, patients, request statuses (`Pending`, `Approved`, `Assigned`, `Completed`), and donation counts.
- **User Management:** Full account management, role switching (`Admin`, `Donor`, `Patient`), and account deletion.
- **Blood Request Controls:** Create emergency hospital requests and manage request fulfillment states.
- **Donation Audit Records:** Monitor donor volunteer commitments and mark transfusions as completed.

### 2. ❤️ Voluntary Donor (Donor Portal)
- **Live Availability Toggle:** One-click status switch (`Available to Donate` vs `Currently Unavailable`).
- **Matched Request Discovery:** Automatic blood group matching highlight (`⭐ Matches Your Blood Group`).
- **Volunteer Workflow:** Single-click commitment to volunteer for active hospital requests.
- **Donation History:** Track past and pending donation commitments.

### 3. 🩸 Patient Care Hub (Patient Portal)
- **Emergency Request Posting:** Submit blood requests with hospital address, required units, and urgency levels (`Normal`, `Urgent`, `Critical`).
- **Fulfillment Tracking:** Monitor real-time status updates (`Pending` -> `Approved` -> `Assigned` -> `Completed`).
- **Donor Directory:** Searchable directory of active registered donors matching required blood types.

---

## 🔑 Pre-Seeded Test Credentials

| Role | Email | Password | Access / Portal |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `admin123` | Full System Control (`/admin/dashboard`) |
| **Donor** | `donor@gmail.com` | `donor123` | Donor Portal (`/donor/dashboard`) |
| **Patient** | `patient@gmail.com` | `patient123` | Patient Care Hub (`/patient/dashboard`) |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 + Vite 8
- **Routing:** React Router DOM v7
- **HTTP Client:** Axios (with Bearer token interceptor)
- **Styling:** Vanilla CSS design tokens (Glassmorphism theme)

### Backend
- **Framework:** FastAPI (Python 3.11)
- **ORM & Database:** SQLAlchemy with SQLite (`blood_donation.db`)
- **Security & Auth:** PyJWT (Jose), Passlib (bcrypt), HTTP Bearer middleware
- **Data Validation:** Pydantic v2

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.11+)

### 1. Clone the Repository
```bash
git clone https://github.com/ke961/Blood-Donation-Management-System-Web.git
cd Blood-Donation-Management-System-Web
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*Backend API will run at `http://127.0.0.1:8000`*

### 3. Frontend Setup
```bash
# In a new terminal window:
cd frontend
npm install
npm run dev
```
*Frontend dev server will run at `http://localhost:5173`*

---

## 📚 PRD & Architecture Documentation

Detailed product requirement documentation is available in the [`feature/PRD-phase/`](file:///c:/Users/Hp/Documents/GitHub/Blood-Donation-Management-System-Web/feature/PRD-phase/) directory:

- 👥 **[Users & Personas](file:///c:/Users/Hp/Documents/GitHub/Blood-Donation-Management-System-Web/feature/PRD-phase/Users):** User Role Specifications & Access Control Matrix
- 📖 **[User Stories](file:///c:/Users/Hp/Documents/GitHub/Blood-Donation-Management-System-Web/feature/PRD-phase/User_Stories):** Detailed user stories for Admin, Donor, and Patient
- 🔄 **[Use Cases](file:///c:/Users/Hp/Documents/GitHub/Blood-Donation-Management-System-Web/feature/PRD-phase/Use_Cases):** Use case flows and alternative scenarios
- ✅ **[Acceptance Criteria](file:///c:/Users/Hp/Documents/GitHub/Blood-Donation-Management-System-Web/feature/PRD-phase/Acceptance_Criteria):** Given-When-Then BDD specifications
- 🗺️ **[User Journeys](file:///c:/Users/Hp/Documents/GitHub/Blood-Donation-Management-System-Web/feature/PRD-phase/design_user_journey):** Flowchart diagrams for user interactions
- 📊 **[Data Flow Diagrams (DFD)](file:///c:/Users/Hp/Documents/GitHub/Blood-Donation-Management-System-Web/feature/PRD-phase/Data_Flow_Diagram%20_DFD):** Level 0 and Level 1 DFD models
- 🗄️ **[Entity Relationship Diagram (ERD)](file:///c:/Users/Hp/Documents/GitHub/Blood-Donation-Management-System-Web/feature/PRD-phase/Design%20Entity%20Relationship%20Diagram%20%28ERD%29):** Database schema and foreign key relationships
- 📜 **[GitHub Issues & PRs Guide](file:///c:/Users/Hp/Documents/GitHub/Blood-Donation-Management-System-Web/docs/admin-feature-issues-and-prs.md):** Form submission copy-paste guide for Admin feature assessment

---

## 📄 License
This project is licensed under the MIT License.
