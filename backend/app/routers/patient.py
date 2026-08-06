from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..auth import get_current_user
from ..database import get_db
from ..models import BloodRequest
from ..schemas import BloodRequestCreate

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
    my_requests = db.query(BloodRequest).filter(BloodRequest.patient_id == patient_id).all()

    return {
        "message": "Patient dashboard is working",
        "user": current_user,
        "total_requests": len(my_requests),
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

    return [
        {
            "id": r.id,
            "blood_group": r.blood_group,
            "hospital": r.hospital,
            "quantity": r.quantity,
            "urgency": r.urgency or "Normal",
            "status": r.status,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else None,
        }
        for r in requests
    ]


@router.post("/requests")
def create_patient_request(
    request_data: BloodRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_id = current_user.get("user_id")

    new_request = BloodRequest(
        patient_id=patient_id,
        patient_name=request_data.patient_name,
        contact_number=request_data.contact_number,
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
        "message": "Blood request submitted successfully",
        "request": {
            "id": new_request.id,
            "blood_group": new_request.blood_group,
            "hospital": new_request.hospital,
            "quantity": new_request.quantity,
            "status": new_request.status,
        },
    }