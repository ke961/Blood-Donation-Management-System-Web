# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from sqlalchemy import func

# from ..database import get_db
# from ..models import User, BloodRequest, Donation

# router = APIRouter(prefix="/admin", tags=["Admin"])


# @router.get("/dashboard")
# def get_dashboard(db: Session = Depends(get_db)):
#     total_users = db.query(User).count()
#     total_donors = db.query(User).filter(User.role == "donor").count()
#     total_patients = db.query(User).filter(User.role == "patient").count()
#     total_requests = db.query(BloodRequest).count()
#     pending_requests = db.query(BloodRequest).filter(BloodRequest.status == "Pending").count()
#     completed_donations = db.query(Donation).count()

#     return {
#         "total_users": total_users,
#         "total_donors": total_donors,
#         "total_patients": total_patients,
#         "total_requests": total_requests,
#         "pending_requests": pending_requests,
#         "completed_donations": completed_donations
#     }


# @router.get("/users")
# def get_users(db: Session = Depends(get_db)):
#     users = db.query(User).all()

#     return users


# @router.delete("/users/{user_id}")
# def delete_user(user_id: int, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.id == user_id).first()

#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     db.delete(user)
#     db.commit()

#     return {
#         "message": "User deleted successfully"
#     }


# @router.get("/donors")
# def get_donors(db: Session = Depends(get_db)):
#     donors = db.query(User).filter(User.role == "donor").all()

#     return donors


# @router.get("/requests")
# def get_requests(db: Session = Depends(get_db)):
#     requests = db.query(BloodRequest).all()

#     return requests


# @router.put("/requests/{request_id}/approve")
# def approve_request(request_id: int, db: Session = Depends(get_db)):
#     request = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()

#     if not request:
#         raise HTTPException(status_code=404, detail="Request not found")

#     request.status = "Approved"

#     db.commit()

#     return {
#         "message": "Request approved"
#     }


# @router.put("/requests/{request_id}/reject")
# def reject_request(request_id: int, db: Session = Depends(get_db)):
#     request = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()

#     if not request:
#         raise HTTPException(status_code=404, detail="Request not found")

#     request.status = "Rejected"

#     db.commit()

#     return {
#         "message": "Request rejected"
#     }


# @router.put("/requests/{request_id}/assign")
# def assign_request(request_id: int, donor_id: int, db: Session = Depends(get_db)):
#     request = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()

#     donor = db.query(User).filter(
#         User.id == donor_id,
#         User.role == "donor"
#     ).first()

#     if not request:
#         raise HTTPException(status_code=404, detail="Request not found")

#     if not donor:
#         raise HTTPException(status_code=404, detail="Donor not found")

#     request.status = "Assigned"

#     db.commit()

#     return {
#         "message": f"Request assigned to donor {donor.full_name}"
#     }


# @router.get("/reports")
# def get_reports(db: Session = Depends(get_db)):
#     blood_group_stats = db.query(
#         User.blood_group,
#         func.count(User.id)
#     ).filter(User.role == "donor").group_by(User.blood_group).all()

#     return {
#         "blood_group_stats": blood_group_stats
#     }




from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional

from ..database import get_db
from ..models import User, BloodRequest, Donation
from ..auth import get_current_admin


# Every route in this router requires a valid Admin JWT token
router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)]
)


# =========================================================
# Request Schemas
# =========================================================

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None


class AssignDonorRequest(BaseModel):
    donor_id: int


# =========================================================
# Admin Dashboard
# =========================================================

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):

    total_users = db.query(User).count()

    total_donors = db.query(User).filter(
        User.role == "donor"
    ).count()

    total_patients = db.query(User).filter(
        User.role == "patient"
    ).count()

    total_requests = db.query(BloodRequest).count()

    pending_requests = db.query(BloodRequest).filter(
        BloodRequest.status == "Pending"
    ).count()

    approved_requests = db.query(BloodRequest).filter(
        BloodRequest.status == "Approved"
    ).count()

    assigned_requests = db.query(BloodRequest).filter(
        BloodRequest.status == "Assigned"
    ).count()

    completed_donations = db.query(Donation).filter(
        Donation.status == "Completed"
    ).count()

    return {
        "total_users": total_users,
        "total_donors": total_donors,
        "total_patients": total_patients,
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "assigned_requests": assigned_requests,
        "completed_donations": completed_donations
    }


# =========================================================
# Manage All Users
# =========================================================

@router.get("/users")
def get_users(db: Session = Depends(get_db)):

    users = db.query(User).order_by(User.id.desc()).all()

    return users


@router.get("/users/{user_id}")
def get_single_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user_data.role is not None:
        allowed_roles = ["admin", "donor", "patient"]

        if user_data.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user role"
            )

        user.role = user_data.role

    if user_data.full_name is not None:
        user.full_name = user_data.full_name

    if user_data.phone is not None:
        user.phone = user_data.phone

    if user_data.blood_group is not None:
        user.blood_group = user_data.blood_group

    if user_data.gender is not None:
        user.gender = user_data.gender

    if user_data.address is not None:
        user.address = user_data.address

    db.commit()
    db.refresh(user)

    return {
        "message": "User updated successfully",
        "user": user
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin account cannot be deleted"
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }


# =========================================================
# Manage Donors
# =========================================================

@router.get("/donors")
def get_donors(
    blood_group: Optional[str] = None,
    db: Session = Depends(get_db)
):

    query = db.query(User).filter(
        User.role == "donor"
    )

    if blood_group:
        query = query.filter(
            User.blood_group == blood_group
        )

    donors = query.order_by(User.id.desc()).all()

    return donors


@router.get("/donors/{donor_id}")
def get_single_donor(
    donor_id: int,
    db: Session = Depends(get_db)
):

    donor = db.query(User).filter(
        User.id == donor_id,
        User.role == "donor"
    ).first()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )

    return donor


@router.delete("/donors/{donor_id}")
def delete_donor(
    donor_id: int,
    db: Session = Depends(get_db)
):

    donor = db.query(User).filter(
        User.id == donor_id,
        User.role == "donor"
    ).first()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )

    db.delete(donor)
    db.commit()

    return {
        "message": "Donor deleted successfully"
    }


# =========================================================
# Manage Patients
# =========================================================

@router.get("/patients")
def get_patients(db: Session = Depends(get_db)):

    patients = db.query(User).filter(
        User.role == "patient"
    ).order_by(User.id.desc()).all()

    return patients


@router.get("/patients/{patient_id}")
def get_single_patient(
    patient_id: int,
    db: Session = Depends(get_db)
):

    patient = db.query(User).filter(
        User.id == patient_id,
        User.role == "patient"
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    return patient


# =========================================================
# Manage Blood Requests
# =========================================================

@router.get("/requests")
def get_requests(
    request_status: Optional[str] = None,
    db: Session = Depends(get_db)
):

    query = db.query(BloodRequest)

    if request_status:
        query = query.filter(
            BloodRequest.status == request_status
        )

    requests = query.order_by(
        BloodRequest.id.desc()
    ).all()

    return requests


@router.get("/requests/{request_id}")
def get_single_request(
    request_id: int,
    db: Session = Depends(get_db)
):

    blood_request = db.query(BloodRequest).filter(
        BloodRequest.id == request_id
    ).first()

    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found"
        )

    return blood_request


@router.put("/requests/{request_id}/approve")
def approve_request(
    request_id: int,
    db: Session = Depends(get_db)
):

    blood_request = db.query(BloodRequest).filter(
        BloodRequest.id == request_id
    ).first()

    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found"
        )

    if blood_request.status in ["Assigned", "Completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned or completed request cannot be approved again"
        )

    blood_request.status = "Approved"

    db.commit()
    db.refresh(blood_request)

    return {
        "message": "Blood request approved successfully",
        "request": blood_request
    }


@router.put("/requests/{request_id}/reject")
def reject_request(
    request_id: int,
    db: Session = Depends(get_db)
):

    blood_request = db.query(BloodRequest).filter(
        BloodRequest.id == request_id
    ).first()

    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found"
        )

    if blood_request.status == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed request cannot be rejected"
        )

    blood_request.status = "Rejected"

    db.commit()
    db.refresh(blood_request)

    return {
        "message": "Blood request rejected successfully",
        "request": blood_request
    }


@router.put("/requests/{request_id}/assign")
def assign_request(
    request_id: int,
    assign_data: AssignDonorRequest,
    db: Session = Depends(get_db)
):

    blood_request = db.query(BloodRequest).filter(
        BloodRequest.id == request_id
    ).first()

    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found"
        )

    donor = db.query(User).filter(
        User.id == assign_data.donor_id,
        User.role == "donor"
    ).first()

    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )

    if blood_request.status == "Rejected":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejected request cannot be assigned"
        )

    if blood_request.status == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed request cannot be assigned"
        )

    if donor.blood_group != blood_request.blood_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Donor blood group does not match the requested blood group"
        )

    existing_donation = db.query(Donation).filter(
        Donation.request_id == request_id
    ).first()

    if existing_donation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A donor has already been assigned to this request"
        )

    donation = Donation(
        donor_id=donor.id,
        request_id=blood_request.id,
        status="Assigned"
    )

    blood_request.status = "Assigned"

    db.add(donation)
    db.commit()
    db.refresh(donation)

    return {
        "message": f"Request assigned to donor {donor.full_name}",
        "donation": donation
    }


@router.put("/requests/{request_id}/complete")
def complete_request(
    request_id: int,
    db: Session = Depends(get_db)
):

    blood_request = db.query(BloodRequest).filter(
        BloodRequest.id == request_id
    ).first()

    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found"
        )

    donation = db.query(Donation).filter(
        Donation.request_id == request_id
    ).first()

    if not donation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No donor has been assigned to this request"
        )

    blood_request.status = "Completed"
    donation.status = "Completed"

    db.commit()
    db.refresh(blood_request)
    db.refresh(donation)

    return {
        "message": "Blood request marked as completed",
        "request": blood_request,
        "donation": donation
    }


@router.delete("/requests/{request_id}")
def delete_request(
    request_id: int,
    db: Session = Depends(get_db)
):

    blood_request = db.query(BloodRequest).filter(
        BloodRequest.id == request_id
    ).first()

    if not blood_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found"
        )

    donation = db.query(Donation).filter(
        Donation.request_id == request_id
    ).first()

    if donation:
        db.delete(donation)

    db.delete(blood_request)
    db.commit()

    return {
        "message": "Blood request deleted successfully"
    }


# =========================================================
# Donation Management
# =========================================================

@router.get("/donations")
def get_donations(db: Session = Depends(get_db)):

    donations = db.query(Donation).order_by(
        Donation.id.desc()
    ).all()

    return donations


# =========================================================
# Reports
# =========================================================

@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):

    blood_group_results = db.query(
        User.blood_group,
        func.count(User.id)
    ).filter(
        User.role == "donor",
        User.blood_group.isnot(None)
    ).group_by(
        User.blood_group
    ).all()

    request_status_results = db.query(
        BloodRequest.status,
        func.count(BloodRequest.id)
    ).group_by(
        BloodRequest.status
    ).all()

    blood_group_stats = [
        {
            "blood_group": blood_group,
            "total_donors": total
        }
        for blood_group, total in blood_group_results
    ]

    request_status_stats = [
        {
            "status": request_status,
            "total_requests": total
        }
        for request_status, total in request_status_results
    ]

    total_donations = db.query(Donation).count()

    completed_donations = db.query(Donation).filter(
        Donation.status == "Completed"
    ).count()

    return {
        "blood_group_stats": blood_group_stats,
        "request_status_stats": request_status_stats,
        "total_donations": total_donations,
        "completed_donations": completed_donations
    }