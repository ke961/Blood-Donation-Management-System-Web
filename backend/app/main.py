from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, SessionLocal
from .models import Base

from .routers import auth
from .routers import admin
from .routers import donor
from .routers import patient

from .utils.create_admin import create_admin

app = FastAPI(title="Blood Donation Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

db = SessionLocal()
create_admin(db)
db.close()

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(donor.router)
app.include_router(patient.router)


@app.get("/")
def root():
    return {
        "message": "Blood Donation Management System API"
    }