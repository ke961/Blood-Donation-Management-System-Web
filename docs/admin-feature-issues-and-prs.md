# GitHub Issues & Pull Requests Guide: Admin Feature

This document contains copy-paste ready GitHub Issues and Pull Requests (PRs) formatted specifically for the **Admin Feature** implementation.

**Repository:** `https://github.com/ke961/Blood-Donation-Management-System-Web`

---

## 1. Frontend Implementation

### A. Frontend Task Issue
- **Title:** `[Frontend] Implement Admin Control Center Dashboard & User Management UI`
- **Labels:** `frontend`, `enhancement`, `admin`
- **Issue Body:**

```markdown
### Feature Description
Implement a modern, high-contrast Admin Control Center frontend interface (`/admin/dashboard`) allowing system administrators to oversee blood donation metrics, manage user permissions, and handle emergency blood requests.

### Key Requirements
- [x] Create `AdminProtectedRoute.jsx` component to guard `/admin/dashboard` route against non-admin users.
- [x] Build `AdminDashboard.jsx` with tabbed navigation:
  - **Overview Tab:** System-wide metrics (Total Users, Registered Donors, Patients, Pending/Approved/Assigned Requests, Completed Donations).
  - **User Management Tab:** Searchable table of all registered users with inline role updates (`Admin`, `Donor`, `Patient`) and account deletion.
  - **Blood Requests Tab:** Table of all active blood requests with filter by status (`Pending`, `Approved`, `Assigned`, `Completed`) and modal form to post new emergency requests.
  - **Donation Records Tab:** History table of voluntary donor commitments with status completion triggers (`Completed`, `Cancelled`).
- [x] Style with responsive dark glassmorphism design tokens in `AdminDashboard.css`.

### Related Endpoints
- `GET /admin/dashboard`
- `GET /admin/users`, `PUT /admin/users/{id}`, `DELETE /admin/users/{id}`
- `GET /admin/requests`, `POST /admin/requests`, `PUT /admin/requests/{id}`, `DELETE /admin/requests/{id}`
- `GET /admin/donations`, `PUT /admin/donations/{id}`, `DELETE /admin/donations/{id}`
```

---

### B. Frontend Pull Request (PR)
- **Title:** `feat(frontend): Add Admin Dashboard, User Management, and Request Controls`
- **PR Description:**

```markdown
### Summary of Changes
Added complete frontend implementation for the Admin Management feature in the Blood Donation Management System.

### Key Additions & Updates
- **Admin Routing Guard:** Implemented `AdminProtectedRoute.jsx` to restrict dashboard access strictly to authenticated users with `admin` JWT scope.
- **Admin Dashboard Component (`AdminDashboard.jsx`):**
  - **Overview Analytics Cards:** Displays live total user counts, active donor count, patient count, pending/approved request tallies, and completed donation metrics.
  - **User Management Table:** Enables viewing all registered accounts, editing user roles dynamically (`admin`, `donor`, `patient`), and deleting accounts.
  - **Blood Request Controls & Modal:** Features inline status updates (`Approved`, `Assigned`, `Completed`), request deletion, and a modal form for posting urgent hospital blood requests.
  - **Donation Records Management:** Allows marking donor commitments as `Completed` or `Cancelled`.
- **CSS Styling (`AdminDashboard.css`):** Formatted with modern glassmorphism design tokens, alert banners, and responsive layouts.

### Verification
- Tested route protection by attempting unauthorized navigation to `/admin/dashboard`.
- Verified live state updates when modifying user roles or blood request statuses.
- Built client bundle via `npm run build` with zero errors.

Closes #1
```

---

## 2. Backend Implementation & Database Integration

### A. Backend Task Issue
- **Title:** `[Backend] Implement Admin API Endpoints, JWT Auth Middleware, and DB Schema Integration`
- **Labels:** `backend`, `database`, `security`, `admin`
- **Issue Body:**

```markdown
### Feature Description
Develop backend API routers, database query methods, and security authorization middleware for administrative management of users, emergency blood requests, and donation records.

### Key Requirements
- [x] Implement JWT authentication dependency `get_current_admin` in `auth.py` to enforce `admin` role authorization.
- [x] Develop `/admin` router endpoints in `routers/admin.py`:
  - `GET /admin/dashboard`: Aggregates database totals for users, donors, patients, requests by status, and donation stats.
  - `GET /admin/users`, `PUT /admin/users/{user_id}`, `DELETE /admin/users/{user_id}`: Full CRUD operations for user role assignments and account deletions.
  - `GET /admin/requests`, `POST /admin/requests`, `PUT /admin/requests/{request_id}`, `DELETE /admin/requests/{request_id}`: Management of emergency blood requests.
  - `GET /admin/donations`, `PUT /admin/donations/{donation_id}`, `DELETE /admin/donations/{donation_id}`: Management of donor commitments.
- [x] Integrate database models (`User`, `BloodRequest`, `Donation`) and implement SQLite column auto-migration (`is_available` column support) in `main.py`.
- [x] Pre-seed default Admin account (`admin@gmail.com` / `admin123`) via `utils/create_admin.py`.

### Technical Stack
- FastAPI, SQLAlchemy ORM, Pydantic, Passlib (bcrypt), PyJWT (jose), SQLite
```

---

### B. Backend Pull Request (PR)
- **Title:** `feat(backend): Implement Admin Endpoints, JWT Security Guard, and Database Migrations`
- **PR Description:**

```markdown
### Summary of Changes
Added complete backend API endpoints, authentication security middleware, and database model integrations for the Admin feature.

### Key Additions & Updates
- **Security & Authorization (`app/auth.py`):** Added `get_current_admin` dependency to decode JWT tokens and enforce `admin` scope verification.
- **Admin Router (`app/routers/admin.py`):**
  - Implemented `/admin/dashboard` returning aggregated system statistics.
  - Added user management endpoints for role modification (`UserRoleUpdate`) and safe deletion.
  - Created CRUD endpoints for blood requests (`BloodRequestCreate`, `BloodRequestUpdate`).
  - Added donation fulfillment status management (`DonationStatusUpdate`).
- **Database Model & Migration (`app/models.py`, `app/main.py`):**
  - Integrated `User`, `BloodRequest`, and `Donation` SQLAlchemy models.
  - Added startup SQLite auto-migration script in `main.py` to automatically detect missing columns (e.g. `users.is_available`) and execute `ALTER TABLE`.
  - Configured automatic seeding of default admin user on initial launch.

### Verification
- Tested backend initialization with `python -c "import app.main"`.
- Verified CORS middleware for frontend API integration.
- Tested admin JWT authentication and endpoint responses.

Closes #2
```
