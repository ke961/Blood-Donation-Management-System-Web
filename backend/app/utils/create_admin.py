from sqlalchemy.orm import Session
from app.models import User, BloodRequest, Donation
from app.auth import hash_password

def create_admin(db: Session):
    # 1. Create Default Admin
    admin = db.query(User).filter(User.email == "admin@gmail.com").first()

    if not admin:
        admin = User(
            full_name="System Admin",
            email="admin@gmail.com",
            password=hash_password("admin123"),
            role="admin",
            phone="01700000000",
            blood_group="O+",
            gender="Female",
            address="Dhaka",
            is_available=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # 2. Create Sample Donors
    sample_donors = [
        {
            "full_name": "John Donor",
            "email": "donor@gmail.com",
            "password": hash_password("donor123"),
            "role": "donor",
            "phone": "01711112222",
            "blood_group": "O+",
            "gender": "Male",
            "address": "Dhanmondi, Dhaka",
            "is_available": True
        },
        {
            "full_name": "Sarah Connor",
            "email": "sarah.donor@gmail.com",
            "password": hash_password("donor123"),
            "role": "donor",
            "phone": "01822223333",
            "blood_group": "A+",
            "gender": "Female",
            "address": "Gulshan, Dhaka",
            "is_available": True
        },
        {
            "full_name": "Rahim Ahmed",
            "email": "rahim.donor@gmail.com",
            "password": hash_password("donor123"),
            "role": "donor",
            "phone": "01933334444",
            "blood_group": "B+",
            "gender": "Male",
            "address": "Agrabad, Chittagong",
            "is_available": True
        },
        {
            "full_name": "Fatima Khan",
            "email": "fatima.donor@gmail.com",
            "password": hash_password("donor123"),
            "role": "donor",
            "phone": "01644445555",
            "blood_group": "AB-",
            "gender": "Female",
            "address": "Zindabazar, Sylhet",
            "is_available": True
        }
    ]

    for donor_data in sample_donors:
        existing = db.query(User).filter(User.email == donor_data["email"]).first()
        if not existing:
            new_donor = User(**donor_data)
            db.add(new_donor)

    db.commit()

    # 3. Create Sample Blood Requests
    requests_count = db.query(BloodRequest).count()
    if requests_count == 0:
        sample_requests = [
            BloodRequest(
                patient_id=admin.id,
                patient_name="Michael Smith",
                contact_number="01799998888",
                blood_group="O+",
                hospital="Square Hospital, Panthapath, Dhaka",
                quantity=2,
                urgency="Critical",
                status="Pending"
            ),
            BloodRequest(
                patient_id=admin.id,
                patient_name="Anika Rahman",
                contact_number="01888887777",
                blood_group="A+",
                hospital="Evercare Hospital, Bashundhara, Dhaka",
                quantity=1,
                urgency="Urgent",
                status="Pending"
            ),
            BloodRequest(
                patient_id=admin.id,
                patient_name="Tariqul Islam",
                contact_number="01977776666",
                blood_group="B+",
                hospital="Chittagong Medical College Hospital",
                quantity=3,
                urgency="Normal",
                status="Pending"
            ),
            BloodRequest(
                patient_id=admin.id,
                patient_name="Laila Hassan",
                contact_number="01666665555",
                blood_group="AB-",
                hospital="Sylhet MAG Osmani Medical College",
                quantity=1,
                urgency="Urgent",
                status="Pending"
            )
        ]

        for req in sample_requests:
            db.add(req)

        db.commit()