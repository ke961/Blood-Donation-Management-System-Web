from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from ..auth import get_current_donor, get_current_user
from ..database import get_db
from ..models import User, BloodRequest, Donation
from ..schemas import UserProfileUpdate, DonationStatusUpdate
from ..websocket_manager import manager

router = APIRouter(
    prefix="/donor",
    tags=["Donor"],
    dependencies=[Depends(get_current_donor)],
)


@router.get("/dashboard")
def donor_dashboard(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    donor_id = current_user.get("user_id")
    donor = db.query(User).filter(User.id == donor_id).first()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found",
        )

    total_donations = db.query(Donation).filter(Donation.donor_id == donor_id).count()
    completed_donations = (
        db.query(Donation)
        .filter(Donation.donor_id == donor_id, Donation.status == "Completed")
        .count()
    )

    # Count pending requests matching donor's blood group
    matching_requests = 0
    if donor.blood_group:
        matching_requests = (
            db.query(BloodRequest)
            .filter(
                BloodRequest.blood_group == donor.blood_group,
                BloodRequest.status.in_(["Pending", "Approved"]),
            )
            .count()
        )

    return {
        "donor_id": donor.id,
        "full_name": donor.full_name,
        "blood_group": donor.blood_group,
        "is_available": donor.is_available if donor.is_available is not None else True,
        "total_donations": total_donations,
        "completed_donations": completed_donations,
        "matching_requests": matching_requests,
        "phone": donor.phone,
        "address": donor.address,
    }


@router.get("/profile")
def get_donor_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    donor_id = current_user.get("user_id")
    donor = db.query(User).filter(User.id == donor_id).first()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return {
        "id": donor.id,
        "full_name": donor.full_name,
        "email": donor.email,
        "role": donor.role,
        "phone": donor.phone,
        "blood_group": donor.blood_group,
        "gender": donor.gender,
        "address": donor.address,
        "is_available": donor.is_available if donor.is_available is not None else True,
    }


@router.put("/profile")
def update_donor_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    donor_id = current_user.get("user_id")
    donor = db.query(User).filter(User.id == donor_id).first()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if profile_data.full_name is not None:
        donor.full_name = profile_data.full_name
    if profile_data.phone is not None:
        donor.phone = profile_data.phone
    if profile_data.blood_group is not None:
        donor.blood_group = profile_data.blood_group
    if profile_data.gender is not None:
        donor.gender = profile_data.gender
    if profile_data.address is not None:
        donor.address = profile_data.address
    if profile_data.is_available is not None:
        donor.is_available = profile_data.is_available

    db.commit()
    db.refresh(donor)

    manager.broadcast_sync("profile_updated", {"user_id": donor.id, "role": "donor"})

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": donor.id,
            "full_name": donor.full_name,
            "email": donor.email,
            "phone": donor.phone,
            "blood_group": donor.blood_group,
            "gender": donor.gender,
            "address": donor.address,
            "is_available": donor.is_available,
        },
    }


@router.put("/availability")
def toggle_availability(
    is_available: bool,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    donor_id = current_user.get("user_id")
    donor = db.query(User).filter(User.id == donor_id).first()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    donor.is_available = is_available
    db.commit()

    manager.broadcast_sync("donor_availability_changed", {"donor_id": donor.id, "is_available": is_available})

    return {
        "message": "Availability status updated",
        "is_available": donor.is_available,
    }


@router.get("/requests")
def get_available_requests(
    blood_group: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    donor_id = current_user.get("user_id")
    donor = db.query(User).filter(User.id == donor_id).first()

    query = db.query(BloodRequest).filter(
        BloodRequest.status.in_(["Pending", "Approved"])
    )

    if blood_group:
        query = query.filter(BloodRequest.blood_group == blood_group)

    requests = query.order_by(BloodRequest.created_at.desc()).all()

    result = []
    for req in requests:
        is_match = donor and (donor.blood_group == req.blood_group)
        patient_name = req.patient_name
        if not patient_name and req.patient:
            patient_name = req.patient.full_name

        result.append({
            "id": req.id,
            "patient_id": req.patient_id,
            "patient_name": patient_name or "Anonymous Patient",
            "contact_number": req.contact_number or (req.patient.phone if req.patient else None),
            "blood_group": req.blood_group,
            "hospital": req.hospital,
            "quantity": req.quantity,
            "urgency": req.urgency or "Normal",
            "status": req.status,
            "created_at": req.created_at.strftime("%Y-%m-%d %H:%M") if req.created_at else None,
            "is_match": is_match,
        })

    return result


@router.post("/donate/{request_id}")
def donate_for_request(
    request_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    donor_id = current_user.get("user_id")

    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Blood request not found"
        )

    if req.status in ["Completed", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot donate for a request that is {req.status}",
        )

    # Check if donor already registered for this request
    existing_donation = (
        db.query(Donation)
        .filter(Donation.donor_id == donor_id, Donation.request_id == request_id)
        .first()
    )

    if existing_donation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already volunteered for this blood request",
        )

    new_donation = Donation(
        donor_id=donor_id,
        request_id=request_id,
        status="Pending",
    )

    req.status = "Assigned"

    db.add(new_donation)
    db.commit()
    db.refresh(new_donation)

    manager.broadcast_sync("donation_created", {"request_id": request_id, "donor_id": donor_id})

    return {
        "message": "Thank you! Your donation offer has been recorded.",
        "donation": {
            "id": new_donation.id,
            "request_id": new_donation.request_id,
            "status": new_donation.status,
            "donation_date": new_donation.donation_date.strftime("%Y-%m-%d %H:%M")
            if new_donation.donation_date
            else None,
        },
    }


@router.get("/donations")
def get_donor_donations(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    donor_id = current_user.get("user_id")
    donations = (
        db.query(Donation)
        .filter(Donation.donor_id == donor_id)
        .order_by(Donation.donation_date.desc())
        .all()
    )

    result = []
    for d in donations:
        req = d.request
        patient_name = req.patient_name if req else None
        if req and not patient_name and req.patient:
            patient_name = req.patient.full_name

        result.append({
            "id": d.id,
            "request_id": d.request_id,
            "donation_date": d.donation_date.strftime("%Y-%m-%d %H:%M") if d.donation_date else None,
            "status": d.status,
            "hospital": req.hospital if req else "N/A",
            "blood_group": req.blood_group if req else "N/A",
            "quantity": req.quantity if req else 0,
            "patient_name": patient_name or "N/A",
        })

    return result


@router.put("/donations/{donation_id}/status")
def update_donation_status(
    donation_id: int,
    status_update: DonationStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    donor_id = current_user.get("user_id")

    donation = (
        db.query(Donation)
        .filter(Donation.id == donation_id, Donation.donor_id == donor_id)
        .first()
    )

    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Donation record not found"
        )

    new_status = status_update.status
    if new_status not in ["Pending", "Completed", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status value"
        )

    donation.status = new_status

    # If completed, update request status to Completed
    if new_status == "Completed" and donation.request:
        donation.request.status = "Completed"
    elif new_status == "Cancelled" and donation.request:
        donation.request.status = "Pending"

    db.commit()

    manager.broadcast_sync("donation_status_changed", {"donation_id": donation.id, "status": donation.status})

    return {
        "message": f"Donation status updated to {new_status}",
        "donation_id": donation.id,
        "status": donation.status,
    }