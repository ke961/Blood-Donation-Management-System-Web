from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models

router = APIRouter(
    prefix="/donor",
    tags=["Donor"]
)


# -----------------------------
# Donor Dashboard
# -----------------------------
@router.get("/dashboard")
def donor_dashboard():

    return {
        "message": "Welcome Donor",
        "features": [
            "Profile",
            "Available Requests",
            "Donation History"
        ]
    }


# -----------------------------
# View Profile
# -----------------------------
@router.get("/profile/{user_id}")
def get_profile(
    user_id: int,
    db: Session = Depends(get_db)
):

    donor = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role == "donor"
    ).first()

    if donor is None:
        raise HTTPException(
            status_code=404,
            detail="Donor not found"
        )

    return donor


# -----------------------------
# Update Profile
# -----------------------------
@router.put("/profile/{user_id}")
def update_profile(
    user_id: int,
    full_name: str,
    phone: str,
    address: str,
    db: Session = Depends(get_db)
):

    donor = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.role == "donor"
    ).first()

    if donor is None:
        raise HTTPException(
            status_code=404,
            detail="Donor not found"
        )

    donor.full_name = full_name
    donor.phone = phone
    donor.address = address

    db.commit()
    db.refresh(donor)

    return {
        "message": "Profile Updated",
        "data": donor
    }


# -----------------------------
# Available Blood Requests
# -----------------------------
@router.get("/requests")
def available_requests(
    db: Session = Depends(get_db)
):

    requests = db.query(models.BloodRequest).filter(
        models.BloodRequest.status == "Pending"
    ).all()

    return requests


# -----------------------------
# Accept Blood Request
# -----------------------------
@router.put("/accept/{request_id}/{donor_id}")
def accept_request(
    request_id: int,
    donor_id: int,
    db: Session = Depends(get_db)
):

    request = db.query(models.BloodRequest).filter(
        models.BloodRequest.id == request_id
    ).first()

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    if request.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail="Request already processed"
        )

    request.status = "Assigned"

    donation = models.Donation(
        donor_id=donor_id,
        request_id=request.id,
        status="Assigned"
    )

    db.add(donation)

    db.commit()

    return {
        "message": "Blood Request Accepted"
    }


# -----------------------------
# Donation History
# -----------------------------
@router.get("/history/{donor_id}")
def donation_history(
    donor_id: int,
    db: Session = Depends(get_db)
):

    history = db.query(models.Donation).filter(
        models.Donation.donor_id == donor_id
    ).all()

    return history