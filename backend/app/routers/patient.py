from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from ..auth import get_current_user
from ..database import get_db
from ..models import User, BloodRequest, Donation
from ..schemas import BloodRequestCreate, BloodRequestUpdate, UserProfileUpdate

router = APIRouter(
    prefix="/patient",
    tags=["Patient"],
)


@router.get("/dashboard")
def patient_dashboard(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_id = current_user.get("user_id")
    patient = db.query(User).filter(User.id == patient_id).first()

    my_requests = db.query(BloodRequest).filter(BloodRequest.patient_id == patient_id).all()

    pending_count = len([r for r in my_requests if r.status == "Pending"])
    approved_count = len([r for r in my_requests if r.status in ["Approved", "Assigned"]])
    completed_count = len([r for r in my_requests if r.status == "Completed"])

    total_donors = db.query(User).filter(User.role == "donor", User.is_available == True).count()

    return {
        "message": "Patient dashboard statistics",
        "full_name": patient.full_name if patient else current_user.get("sub"),
        "email": patient.email if patient else "",
        "blood_group": patient.blood_group if patient else "",
        "phone": patient.phone if patient else "",
        "address": patient.address if patient else "",
        "total_requests": len(my_requests),
        "pending_requests": pending_count,
        "active_requests": approved_count,
        "completed_requests": completed_count,
        "available_donors_count": total_donors,
    }


@router.get("/requests")
def get_patient_requests(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_id = current_user.get("user_id")
    requests = (
        db.query(BloodRequest)
        .filter(BloodRequest.patient_id == patient_id)
        .order_by(BloodRequest.created_at.desc())
        .all()
    )

    result = []
    for r in requests:
        donations = db.query(Donation).filter(Donation.request_id == r.id).all()
        volunteers = []
        for d in donations:
            donor = d.donor
            volunteers.append({
                "donation_id": d.id,
                "donor_id": d.donor_id,
                "donor_name": donor.full_name if donor else "Volunteer Donor",
                "donor_phone": donor.phone if donor else "N/A",
                "donor_blood_group": donor.blood_group if donor else "N/A",
                "donor_address": donor.address if donor else "N/A",
                "status": d.status,
                "donation_date": d.donation_date.strftime("%Y-%m-%d %H:%M") if d.donation_date else None,
            })

        result.append({
            "id": r.id,
            "patient_name": r.patient_name,
            "contact_number": r.contact_number,
            "blood_group": r.blood_group,
            "hospital": r.hospital,
            "quantity": r.quantity,
            "urgency": r.urgency or "Normal",
            "status": r.status,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else None,
            "volunteers_count": len(volunteers),
            "volunteers": volunteers,
        })

    return result


@router.post("/requests")
def create_patient_request(
    request_data: BloodRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_id = current_user.get("user_id")
    patient = db.query(User).filter(User.id == patient_id).first()

    patient_name = request_data.patient_name or (patient.full_name if patient else "Patient")
    contact_number = request_data.contact_number or (patient.phone if patient else "")

    new_request = BloodRequest(
        patient_id=patient_id,
        patient_name=patient_name,
        contact_number=contact_number,
        blood_group=request_data.blood_group,
        hospital=request_data.hospital,
        quantity=request_data.quantity,
        urgency=request_data.urgency or "Normal",
        status="Pending",
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {
        "message": "Blood request submitted successfully!",
        "request": {
            "id": new_request.id,
            "patient_name": new_request.patient_name,
            "blood_group": new_request.blood_group,
            "hospital": new_request.hospital,
            "quantity": new_request.quantity,
            "urgency": new_request.urgency,
            "status": new_request.status,
        },
    }


@router.put("/requests/{request_id}")
def update_patient_request(
    request_id: int,
    update_data: BloodRequestUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_id = current_user.get("user_id")
    req = (
        db.query(BloodRequest)
        .filter(BloodRequest.id == request_id, BloodRequest.patient_id == patient_id)
        .first()
    )

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found or unauthorized",
        )

    if update_data.patient_name is not None:
        req.patient_name = update_data.patient_name
    if update_data.contact_number is not None:
        req.contact_number = update_data.contact_number
    if update_data.blood_group is not None:
        req.blood_group = update_data.blood_group
    if update_data.hospital is not None:
        req.hospital = update_data.hospital
    if update_data.quantity is not None:
        req.quantity = update_data.quantity
    if update_data.urgency is not None:
        req.urgency = update_data.urgency
    if update_data.status is not None:
        req.status = update_data.status

    db.commit()
    db.refresh(req)

    return {
        "message": "Blood request updated successfully",
        "request": {
            "id": req.id,
            "status": req.status,
            "blood_group": req.blood_group,
            "hospital": req.hospital,
        },
    }


@router.delete("/requests/{request_id}")
def delete_patient_request(
    request_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_id = current_user.get("user_id")
    req = (
        db.query(BloodRequest)
        .filter(BloodRequest.id == request_id, BloodRequest.patient_id == patient_id)
        .first()
    )

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found or unauthorized",
        )

    # Delete related donation records first to maintain referential integrity
    db.query(Donation).filter(Donation.request_id == request_id).delete()
    db.delete(req)
    db.commit()

    return {"message": "Blood request deleted successfully"}


@router.get("/donors")
def get_available_donors_for_patient(
    blood_group: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(User.role == "donor")

    if blood_group:
        query = query.filter(User.blood_group == blood_group)

    donors = query.all()

    return [
        {
            "id": d.id,
            "full_name": d.full_name,
            "blood_group": d.blood_group,
            "phone": d.phone,
            "gender": d.gender,
            "address": d.address,
            "is_available": d.is_available if d.is_available is not None else True,
        }
        for d in donors
    ]


@router.get("/profile")
def get_patient_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_id = current_user.get("user_id")
    patient = db.query(User).filter(User.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found"
        )

    return {
        "id": patient.id,
        "full_name": patient.full_name,
        "email": patient.email,
        "role": patient.role,
        "phone": patient.phone,
        "blood_group": patient.blood_group,
        "gender": patient.gender,
        "address": patient.address,
    }


@router.put("/profile")
def update_patient_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_id = current_user.get("user_id")
    patient = db.query(User).filter(User.id == patient_id).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found"
        )

    if profile_data.full_name is not None:
        patient.full_name = profile_data.full_name
    if profile_data.phone is not None:
        patient.phone = profile_data.phone
    if profile_data.blood_group is not None:
        patient.blood_group = profile_data.blood_group
    if profile_data.gender is not None:
        patient.gender = profile_data.gender
    if profile_data.address is not None:
        patient.address = profile_data.address

    db.commit()
    db.refresh(patient)

    return {
        "message": "Patient profile updated successfully",
        "user": {
            "id": patient.id,
            "full_name": patient.full_name,
            "email": patient.email,
            "phone": patient.phone,
            "blood_group": patient.blood_group,
            "gender": patient.gender,
            "address": patient.address,
        },
    }