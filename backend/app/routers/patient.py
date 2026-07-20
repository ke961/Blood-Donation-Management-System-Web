from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import BloodRequestCreate

router = APIRouter(
    prefix="/patient",
    tags=["Patient"]
)


# =====================================
# Patient Dashboard
# =====================================

@router.get("/dashboard")
def patient_dashboard():

    return {
        "message": "Welcome Patient",
        "features": [
            "Profile",
            "Request Blood",
            "Request History"
        ]
    }


# =====================================
# View Profile
# =====================================

@router.get("/profile/{user_id}")
def get_profile(
    user_id: int,
    db: Session = Depends(get_db)
):

    patient = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role == "patient"
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    return patient


# =====================================
# Update Profile
# =====================================

@router.put("/profile/{user_id}")
def update_profile(
    user_id: int,
    full_name: str,
    phone: str,
    address: str,
    db: Session = Depends(get_db)
):

    patient = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role == "patient"
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    patient.full_name = full_name
    patient.phone = phone
    patient.address = address

    db.commit()
    db.refresh(patient)

    return {
        "message": "Profile Updated",
        "data": patient
    }


# =====================================
# Request Blood
# =====================================

@router.post("/request/{patient_id}")
def create_request(
    patient_id: int,
    request: BloodRequestCreate,
    db: Session = Depends(get_db)
):

    patient = db.query(models.User).filter(
        models.User.id == patient_id,
        models.User.role == "patient"
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    new_request = models.BloodRequest(
        patient_id=patient.id,
        blood_group=request.blood_group,
        hospital=request.hospital,
        quantity=request.quantity,
        status="Pending"
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {
        "message": "Blood Request Submitted",
        "request": new_request
    }


# =====================================
# Request History
# =====================================

@router.get("/history/{patient_id}")
def request_history(
    patient_id: int,
    db: Session = Depends(get_db)
):

    history = db.query(models.BloodRequest).filter(
        models.BloodRequest.patient_id == patient_id
    ).all()

    return history


# =====================================
# Cancel Request
# =====================================

@router.delete("/request/{request_id}")
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db)
):

    request = db.query(models.BloodRequest).filter(
        models.BloodRequest.id == request_id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    if request.status == "Completed":
        raise HTTPException(
            status_code=400,
            detail="Completed request cannot be cancelled."
        )

    db.delete(request)
    db.commit()

    return {
        "message": "Blood Request Cancelled Successfully"
    }


# =====================================
# View Single Request
# =====================================

@router.get("/request/{request_id}")
def view_request(
    request_id: int,
    db: Session = Depends(get_db)
):

    request = db.query(models.BloodRequest).filter(
        models.BloodRequest.id == request_id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    return request