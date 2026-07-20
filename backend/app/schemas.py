from pydantic import BaseModel
from pydantic import EmailStr

from typing import Optional


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
# User Response
# -------------------------

class UserResponse(BaseModel):

    id: int

    full_name: str

    email: EmailStr

    role: str

    phone: str

    blood_group: Optional[str]

    gender: str

    address: str

    class Config:
        from_attributes = True


# -------------------------
# Blood Request
# -------------------------

class BloodRequestCreate(BaseModel):

    blood_group: str

    hospital: str

    quantity: int


class BloodRequestResponse(BaseModel):

    id: int

    patient_id: int

    blood_group: str

    hospital: str

    quantity: int

    status: str

    class Config:
        from_attributes = True


# -------------------------
# Donation
# -------------------------

class DonationResponse(BaseModel):

    id: int

    donor_id: int

    request_id: int

    status: str

    class Config:
        from_attributes = True