from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from ..auth import get_current_user, get_current_hospital
from ..database import get_db
from ..models import User, BloodRequest, Donation
from ..schemas import BloodRequestCreate, BloodRequestUpdate, UserProfileUpdate

router = APIRouter(
    prefix="/hospital",
    tags=["Hospital"],
)


@router.get("/dashboard")
def hospital_dashboard(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    hospital_id = current_user.get("user_id")
    hospital = db.query(User).filter(User.id == hospital_id).first()

    hospital_name = hospital.full_name if hospital else current_user.get("sub")

    # Get requests created by or associated with this hospital
    hospital_requests = (
        db.query(BloodRequest)
        .filter(
            (BloodRequest.patient_id == hospital_id)
            | (BloodRequest.hospital.ilike(f"%{hospital_name}%"))
        )
        .all()
    )

    pending_count = len([r for r in hospital_requests if r.status == "Pending"])
    approved_count = len([r for r in hospital_requests if r.status in ["Approved", "Assigned"]])
    completed_count = len([r for r in hospital_requests if r.status == "Completed"])

    total_patient_requests = db.query(BloodRequest).count()
    available_donors = db.query(User).filter(User.role == "donor", User.is_available == True).count()

    return {
        "message": "Hospital dashboard statistics",
        "hospital_id": hospital.id if hospital else hospital_id,
        "full_name": hospital_name,
        "email": hospital.email if hospital else "",
        "phone": hospital.phone if hospital else "",
        "address": hospital.address if hospital else "",
        "blood_group": hospital.blood_group if hospital else "",
        "is_available": hospital.is_available if hospital else True,
        "my_requests_count": len(hospital_requests),
        "pending_requests": pending_count,
        "active_requests": approved_count,
        "completed_requests": completed_count,
        "total_system_requests": total_patient_requests,
        "available_donors_count": available_donors,
    }


@router.get("/my-requests")
def get_hospital_own_requests(
    current_user: dict = Depends(get_current_hospital),
    db: Session = Depends(get_db),
):
    hospital_id = current_user.get("user_id")
    hospital = db.query(User).filter(User.id == hospital_id).first()
    hospital_name = hospital.full_name if hospital else ""

    requests = (
        db.query(BloodRequest)
        .filter(
            (BloodRequest.patient_id == hospital_id)
            | (BloodRequest.hospital.ilike(f"%{hospital_name}%"))
        )
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


@router.get("/all-requests")
def get_all_requests_for_hospital(
    status_filter: Optional[str] = None,
    blood_group: Optional[str] = None,
    current_user: dict = Depends(get_current_hospital),
    db: Session = Depends(get_db),
):
    query = db.query(BloodRequest)

    if status_filter:
        query = query.filter(BloodRequest.status == status_filter)

    if blood_group:
        query = query.filter(BloodRequest.blood_group == blood_group)

    requests = query.order_by(BloodRequest.created_at.desc()).all()

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
                "status": d.status,
            })

        result.append({
            "id": r.id,
            "patient_name": r.patient_name or "Anonymous Patient",
            "contact_number": r.contact_number or (r.patient.phone if r.patient else "N/A"),
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
def create_hospital_request(
    request_data: BloodRequestCreate,
    current_user: dict = Depends(get_current_hospital),
    db: Session = Depends(get_db),
):
    hospital_id = current_user.get("user_id")
    hospital = db.query(User).filter(User.id == hospital_id).first()

    hospital_name = hospital.full_name if hospital else "Hospital Emergency Ward"
    contact_number = request_data.contact_number or (hospital.phone if hospital else "")
    hospital_address = request_data.hospital or (hospital.address if hospital else hospital_name)

    new_request = BloodRequest(
        patient_id=hospital_id,
        patient_name=request_data.patient_name or f"{hospital_name} (Emergency Request)",
        contact_number=contact_number,
        blood_group=request_data.blood_group,
        hospital=hospital_address,
        quantity=request_data.quantity,
        urgency=request_data.urgency or "Urgent",
        status="Pending",
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {
        "message": "Hospital blood request posted successfully!",
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
def respond_or_update_request(
    request_id: int,
    update_data: BloodRequestUpdate,
    current_user: dict = Depends(get_current_hospital),
    db: Session = Depends(get_db),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found",
        )

    if update_data.status is not None:
        req.status = update_data.status
    if update_data.quantity is not None:
        req.quantity = update_data.quantity
    if update_data.urgency is not None:
        req.urgency = update_data.urgency
    if update_data.hospital is not None:
        req.hospital = update_data.hospital

    db.commit()
    db.refresh(req)

    return {
        "message": f"Blood request status updated to {req.status}",
        "request": {
            "id": req.id,
            "status": req.status,
            "blood_group": req.blood_group,
            "hospital": req.hospital,
        },
    }


@router.delete("/requests/{request_id}")
def delete_hospital_request(
    request_id: int,
    current_user: dict = Depends(get_current_hospital),
    db: Session = Depends(get_db),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found",
        )

    db.query(Donation).filter(Donation.request_id == request_id).delete()
    db.delete(req)
    db.commit()

    return {"message": "Blood request removed successfully"}


@router.get("/donors")
def get_donors_for_hospital(
    blood_group: Optional[str] = None,
    current_user: dict = Depends(get_current_hospital),
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
def get_hospital_profile(
    current_user: dict = Depends(get_current_hospital),
    db: Session = Depends(get_db),
):
    hospital_id = current_user.get("user_id")
    hospital = db.query(User).filter(User.id == hospital_id).first()

    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Hospital profile not found"
        )

    return {
        "id": hospital.id,
        "full_name": hospital.full_name,
        "email": hospital.email,
        "role": hospital.role,
        "phone": hospital.phone,
        "blood_group": hospital.blood_group,
        "gender": hospital.gender,
        "address": hospital.address,
        "is_available": hospital.is_available if hospital.is_available is not None else True,
    }


@router.put("/profile")
def update_hospital_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_hospital),
    db: Session = Depends(get_db),
):
    hospital_id = current_user.get("user_id")
    hospital = db.query(User).filter(User.id == hospital_id).first()

    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Hospital profile not found"
        )

    if profile_data.full_name is not None:
        hospital.full_name = profile_data.full_name
    if profile_data.phone is not None:
        hospital.phone = profile_data.phone
    if profile_data.blood_group is not None:
        hospital.blood_group = profile_data.blood_group
    if profile_data.address is not None:
        hospital.address = profile_data.address
    if profile_data.is_available is not None:
        hospital.is_available = profile_data.is_available

    db.commit()
    db.refresh(hospital)

    return {
        "message": "Hospital profile updated successfully",
        "user": {
            "id": hospital.id,
            "full_name": hospital.full_name,
            "email": hospital.email,
            "phone": hospital.phone,
            "blood_group": hospital.blood_group,
            "address": hospital.address,
            "is_available": hospital.is_available,
        },
    }


@router.get("/list")
def list_registered_hospitals(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(User.role == "hospital")

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            (User.full_name.ilike(s)) | (User.address.ilike(s))
        )

    hospitals = query.all()

    return [
        {
            "id": h.id,
            "name": h.full_name,
            "city": h.address or "General District",
            "address": h.address or "Hospital Complex",
            "phone": h.phone or "N/A",
            "emergency_services": "24/7 Transfusion & ICU Care",
            "blood_bank_status": "Active Transfusion Center" if h.is_available else "High Demand",
            "available_groups": [h.blood_group] if h.blood_group else ["A+", "B+", "O+", "O-", "AB+"],
            "is_registered_user": True,
        }
        for h in hospitals
    ]


SAMPLE_HOSPITALS_NETWORK = [
    {
        "id": "hosp-1",
        "name": "Central Emergency General Hospital",
        "city": "Downtown Metro",
        "address": "450 Healthcare Boulevard, Suite 100",
        "phone": "+1 (555) 019-2831",
        "emergency_services": "24/7 ICU & Trauma Care",
        "blood_bank_status": "Active Stock Available",
        "available_groups": ["A+", "B+", "O+", "O-", "AB+"],
        "active_requests": [
            {
                "id": "sample-req-1",
                "patient_name": "Sarah Jenkins (ICU Room 302)",
                "blood_group": "O-",
                "quantity": 3,
                "urgency": "Critical",
                "status": "Pending",
                "contact_number": "+1 (555) 019-2831",
            },
            {
                "id": "sample-req-2",
                "patient_name": "Emergency Surgical Suite",
                "blood_group": "A+",
                "quantity": 2,
                "urgency": "Urgent",
                "status": "Pending",
                "contact_number": "+1 (555) 019-2831",
            },
        ],
    },
    {
        "id": "hosp-2",
        "name": "St. Jude Specialized Trauma & Surgical Center",
        "city": "North District",
        "address": "128 Medical Center Drive",
        "phone": "+1 (555) 432-8900",
        "emergency_services": "24/7 Blood Bank & Emergency Surgery",
        "blood_bank_status": "High Demand (Urgent O- Needed)",
        "available_groups": ["A+", "B-", "AB-", "O+"],
        "active_requests": [
            {
                "id": "sample-req-3",
                "patient_name": "Robert Chen (Trauma Ward B)",
                "blood_group": "AB+",
                "quantity": 2,
                "urgency": "Urgent",
                "status": "Pending",
                "contact_number": "+1 (555) 432-8900",
            },
        ],
    },
    {
        "id": "hosp-3",
        "name": "Metropolitan Children's Hospital",
        "city": "Westside",
        "address": "89 Pediatric Avenue",
        "phone": "+1 (555) 789-0123",
        "emergency_services": "Pediatric Transfusion & Emergency Care",
        "blood_bank_status": "Active Stock Available",
        "available_groups": ["O-", "O+", "A-", "B+"],
        "active_requests": [
            {
                "id": "sample-req-4",
                "patient_name": "Elena Rostova (Pediatric Ward)",
                "blood_group": "B-",
                "quantity": 1,
                "urgency": "Urgent",
                "status": "Pending",
                "contact_number": "+1 (555) 789-0123",
            },
        ],
    },
    {
        "id": "hosp-4",
        "name": "City Memorial Trauma & Red Cross Center",
        "city": "Eastside",
        "address": "56 Memorial Parkway",
        "phone": "+1 (555) 234-5678",
        "emergency_services": "Regional Blood Bank & Emergency Ward",
        "blood_bank_status": "Full Blood Stock Available",
        "available_groups": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        "active_requests": [
            {
                "id": "sample-req-5",
                "patient_name": "Emergency Blood Bank Reserve",
                "blood_group": "O+",
                "quantity": 4,
                "urgency": "Normal",
                "status": "Pending",
                "contact_number": "+1 (555) 234-5678",
            },
        ],
    },
    {
        "id": "hosp-5",
        "name": "Apex University Medical & Research Center",
        "city": "South Campus",
        "address": "900 University Drive",
        "phone": "+1 (555) 678-9012",
        "emergency_services": "24/7 Organ & Transfusion Center",
        "blood_bank_status": "Stock Available",
        "available_groups": ["B+", "AB+", "O+", "A+"],
        "active_requests": [
            {
                "id": "sample-req-6",
                "patient_name": "Cardiovascular Surgery Unit",
                "blood_group": "A-",
                "quantity": 2,
                "urgency": "Critical",
                "status": "Pending",
                "contact_number": "+1 (555) 678-9012",
            },
        ],
    },
    {
        "id": "hosp-6",
        "name": "Grace Mercy Care Medical Center",
        "city": "Midtown Center",
        "address": "312 Mercy Care Way",
        "phone": "+1 (555) 321-7654",
        "emergency_services": "24/7 Emergency Ward & Dialysis Unit",
        "blood_bank_status": "Moderate Stock Available",
        "available_groups": ["A+", "B+", "O+", "AB-"],
        "active_requests": [
            {
                "id": "sample-req-7",
                "patient_name": "General Surgery Ward 5",
                "blood_group": "B+",
                "quantity": 3,
                "urgency": "Urgent",
                "status": "Pending",
                "contact_number": "+1 (555) 321-7654",
            },
        ],
    },
    {
        "id": "hosp-7",
        "name": "Mount Sinai Emergency Hospital & Blood Bank",
        "city": "Highland Park",
        "address": "740 Sinai Mountain Road",
        "phone": "+1 (555) 987-1234",
        "emergency_services": "24/7 Level 1 Trauma Center",
        "blood_bank_status": "Urgent Need for O- & A-",
        "available_groups": ["A+", "B+", "O+"],
        "active_requests": [
            {
                "id": "sample-req-8",
                "patient_name": "Trauma Resuscitation Unit",
                "blood_group": "O-",
                "quantity": 4,
                "urgency": "Critical",
                "status": "Pending",
                "contact_number": "+1 (555) 987-1234",
            },
        ],
    },
    {
        "id": "hosp-8",
        "name": "Sunrise Community Health & Trauma Center",
        "city": "Oakridge District",
        "address": "512 Sunrise Boulevard",
        "phone": "+1 (555) 654-9870",
        "emergency_services": "Emergency Transfusion & Maternity Care",
        "blood_bank_status": "Active Stock Available",
        "available_groups": ["O+", "A+", "B-", "AB+"],
        "active_requests": [
            {
                "id": "sample-req-9",
                "patient_name": "Maternity Delivery Ward Room 12",
                "blood_group": "O+",
                "quantity": 2,
                "urgency": "Urgent",
                "status": "Pending",
                "contact_number": "+1 (555) 654-9870",
            },
        ],
    },
    {
        "id": "hosp-9",
        "name": "Sacred Heart Medical & Surgical Center",
        "city": "Riverside",
        "address": "820 Riverside Drive",
        "phone": "+1 (555) 456-7890",
        "emergency_services": "Emergency Surgery & Oncology Ward",
        "blood_bank_status": "Stock Available",
        "available_groups": ["A-", "B+", "AB+", "O+"],
        "active_requests": [
            {
                "id": "sample-req-10",
                "patient_name": "Oncology Suite 3B",
                "blood_group": "AB-",
                "quantity": 1,
                "urgency": "Normal",
                "status": "Pending",
                "contact_number": "+1 (555) 456-7890",
            },
        ],
    },
    {
        "id": "hosp-10",
        "name": "Horizon Regional Trauma Hospital",
        "city": "Valley View",
        "address": "105 Horizon Ridge Way",
        "phone": "+1 (555) 876-1234",
        "emergency_services": "24/7 Regional Emergency Response",
        "blood_bank_status": "Stock Available",
        "available_groups": ["O+", "A+", "B+", "O-"],
        "active_requests": [
            {
                "id": "sample-req-11",
                "patient_name": "Accident & Emergency Room 4",
                "blood_group": "A+",
                "quantity": 2,
                "urgency": "Urgent",
                "status": "Pending",
                "contact_number": "+1 (555) 876-1234",
            },
        ],
    },
]


@router.get("/hospitals")
def get_hospitals_network_for_hospital(
    search: Optional[str] = None,
    blood_group: Optional[str] = None,
    current_user: dict = Depends(get_current_hospital),
    db: Session = Depends(get_db),
):
    db_hospitals = db.query(User).filter(User.role == "hospital").all()
    db_list = []
    for h in db_hospitals:
        # Find DB requests associated with this hospital user
        reqs = (
            db.query(BloodRequest)
            .filter(
                (BloodRequest.patient_id == h.id)
                | (BloodRequest.hospital.ilike(f"%{h.full_name}%")),
                BloodRequest.status.in_(["Pending", "Approved", "Assigned"]),
            )
            .all()
        )
        active_reqs = [
            {
                "id": r.id,
                "patient_name": r.patient_name or "Emergency Patient",
                "blood_group": r.blood_group,
                "quantity": r.quantity,
                "urgency": r.urgency or "Normal",
                "status": r.status,
                "contact_number": r.contact_number or h.phone or "N/A",
            }
            for r in reqs
        ]

        db_list.append({
            "id": f"user-hosp-{h.id}",
            "name": h.full_name,
            "city": h.address or "Central District",
            "address": h.address or "Emergency Transfusion Complex",
            "phone": h.phone or "N/A",
            "emergency_services": "24/7 ICU & Emergency Blood Bank",
            "blood_bank_status": "Registered Hospital Center" if h.is_available else "Limited Stock",
            "available_groups": [h.blood_group] if h.blood_group else ["A+", "B+", "O+", "O-", "AB+"],
            "active_requests": active_reqs,
        })

    hospitals = db_list + SAMPLE_HOSPITALS_NETWORK

    if search:
        s = search.lower()
        hospitals = [
            h
            for h in hospitals
            if s in h["name"].lower()
            or s in h["address"].lower()
            or s in h["city"].lower()
        ]
    if blood_group:
        filtered = []
        for h in hospitals:
            has_stock = blood_group in h["available_groups"]
            has_req = any(r["blood_group"] == blood_group for r in h.get("active_requests", []))
            if has_stock or has_req:
                filtered.append(h)
        hospitals = filtered

    return hospitals


