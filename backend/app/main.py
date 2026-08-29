# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from .database import engine, SessionLocal
# from .models import Base

# from .routers import auth
# from .routers import admin
# from .routers import donor
# from .routers import patient

# from .utils.create_admin import create_admin

# app = FastAPI(title="Blood Donation Management System")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Base.metadata.create_all(bind=engine)

# db = SessionLocal()
# create_admin(db)
# db.close()

# app.include_router(auth.router)
# app.include_router(admin.router)
# app.include_router(donor.router)
# app.include_router(patient.router)


# @app.get("/")
# def root():
#     return {
#         "message": "Blood Donation Management System API"
#     }


from typing import Optional
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text, case
from sqlalchemy.orm import Session

from .database import engine, SessionLocal, get_db
from .models import Base, BloodRequest
from .routers import admin, auth, donor, patient, hospital
from .utils.create_admin import create_admin
from .websocket_manager import manager


app = FastAPI(
    title="Blood Donation Management System",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto-migrate missing columns for existing SQLite DBs
with engine.connect() as conn:
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("users")]
        if "is_available" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_available BOOLEAN DEFAULT 1"))
            conn.commit()


# Automatically create Admin account
db = SessionLocal()

try:
    create_admin(db)
finally:
    db.close()


# Register all routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(donor.router)
app.include_router(patient.router)
app.include_router(hospital.router)



@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Blood Donation Management System API"
    }


@app.get("/public/emergency-requests", tags=["Public"])
@app.get("/emergency-requests", tags=["Public"])
def get_public_emergency_requests(
    blood_group: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(BloodRequest).filter(
        BloodRequest.status.in_(["Pending", "Approved", "Assigned"])
    )

    if blood_group and blood_group.strip() and blood_group.upper() != "ALL":
        query = query.filter(BloodRequest.blood_group == blood_group.strip())

    requests = query.order_by(
        case(
            (BloodRequest.urgency.in_(["Urgent", "Critical", "Emergency"]), 0),
            else_=1,
        ),
        BloodRequest.created_at.desc(),
    ).all()

    result = []
    for req in requests:
        patient_name = req.patient_name
        if not patient_name and req.patient:
            patient_name = req.patient.full_name

        contact_number = req.contact_number
        if not contact_number and req.patient:
            contact_number = req.patient.phone

        result.append({
            "id": req.id,
            "patient_name": patient_name or "Emergency Patient",
            "contact_number": contact_number or "Contact Hospital Direct",
            "blood_group": req.blood_group,
            "hospital": req.hospital,
            "quantity": req.quantity,
            "urgency": req.urgency or "Normal",
            "status": req.status,
            "created_at": req.created_at.strftime("%Y-%m-%d %H:%M") if req.created_at else None,
        })

    return result


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; we only use server->client broadcasts
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
