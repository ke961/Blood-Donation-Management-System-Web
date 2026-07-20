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


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, SessionLocal
from .models import Base

from .routers import auth
from .routers import admin
from .routers import donor
from .routers import patient

from .utils.create_admin import create_admin


app = FastAPI(
    title="Blood Donation Management System",
    version="0.1.0"
)


# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables
Base.metadata.create_all(bind=engine)


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


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Blood Donation Management System API"
    }