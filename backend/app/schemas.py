from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# -------------------------
# Register
# -------------------------

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: str
    blood_group: Optional[str] = None
    gender: str
    address: str
    role: str


# -------------------------
# Login
# -------------------------

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# -------------------------
# User Response & Update
# -------------------------

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    phone: str
    blood_group: Optional[str] = None
    gender: str
    address: str
    is_available: Optional[bool] = True

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    is_available: Optional[bool] = None


class UserRoleUpdate(BaseModel):
    role: str


# -------------------------
# Blood Request
# -------------------------

class BloodRequestCreate(BaseModel):
    blood_group: str
    hospital: str
    quantity: int
    urgency: Optional[str] = "Normal"
    patient_name: Optional[str] = None
    contact_number: Optional[str] = None


class BloodRequestUpdate(BaseModel):
    blood_group: Optional[str] = None
    hospital: Optional[str] = None
    quantity: Optional[int] = None
    urgency: Optional[str] = None
    status: Optional[str] = None
    patient_name: Optional[str] = None
    contact_number: Optional[str] = None


class BloodRequestResponse(BaseModel):
    id: int
    patient_id: Optional[int] = None
    patient_name: Optional[str] = None
    contact_number: Optional[str] = None
    blood_group: str
    hospital: str
    quantity: int
    urgency: Optional[str] = "Normal"
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# -------------------------
# Donation
# -------------------------

class DonationResponse(BaseModel):
    id: int
    donor_id: int
    request_id: int
    donation_date: Optional[datetime] = None
    status: str
    donor: Optional[UserResponse] = None
    request: Optional[BloodRequestResponse] = None

    class Config:
        from_attributes = True


class DonationStatusUpdate(BaseModel):
    status: str
