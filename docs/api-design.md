 API Design

## Base URL
https://api.blooddonation.com/v1

## Auth
Header: Authorization: Bearer <token>

## Response Format
```json
{
    "status": "success",
    "data": {},
    "message": "",
    "timestamp": "2024-01-01T00:00:00Z"
}

Endpoints
Auth
POST /auth/login
POST /auth/register
POST /auth/logout
POST /auth/refresh
POST /auth/forgot-password

Users
GET  /users/profile
PUT  /users/profile
GET  /users/:id
Donors
text
POST /donors/register
GET  /donors/:id/history
GET  /donors/eligibility

Appointments
GET    /appointments
POST   /appointments
PUT    /appointments/:id
DELETE /appointments/:id

Inventory
GET  /inventory
GET  /inventory/expiring
POST /inventory/units

Requests
GET  /requests
POST /requests
PUT  /requests/:id

Notifications
GET  /notifications
PUT  /notifications/:id/read

Reports
GET /reports/donations
GET /reports/inventory
GET /reports/dashboard

Status Codes
Code	Meaning
200	Success
201	Created
400	Bad Request
401	Unauthorized
403	Forbidden
404	Not Found
500	Server Error

Rate Limits
100 req/min (users)
1000 req/min (admins)
