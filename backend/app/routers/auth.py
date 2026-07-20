# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session

# from ..database import get_db
# from ..models import User
# from ..schemas import UserRegister, UserLogin
# from ..auth import hash_password, verify_password, create_access_token

# router = APIRouter(prefix="/auth", tags=["Authentication"])


# @router.post("/register")
# def register(user: UserRegister, db: Session = Depends(get_db)):
#     if user.role not in ["donor", "patient"]:
#         raise HTTPException(status_code=400, detail="Only donor and patient can register")

#     existing_user = db.query(User).filter(User.email == user.email).first()

#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     new_user = User(
#         full_name=user.full_name,
#         email=user.email,
#         password=hash_password(user.password),
#         role=user.role,
#         phone=user.phone,
#         blood_group=user.blood_group,
#         gender=user.gender,
#         address=user.address
#     )

#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)

#     return {
#         "message": "User registered successfully",
#         "role": new_user.role
#     }


# @router.post("/admin/login")
# def admin_login(user: UserLogin, db: Session = Depends(get_db)):

#     admin = db.query(User).filter(
#         User.email == user.email,
#         User.role == "admin"
#     ).first()

#     if not admin:
#         raise HTTPException(
#             status_code=401,
#             detail="Invalid admin credentials"
#         )

#     if not verify_password(user.password, admin.password):
#         raise HTTPException(
#             status_code=401,
#             detail="Invalid admin credentials"
#         )

#     access_token = create_access_token({
#         "sub": admin.email,
#         "role": admin.role,
#         "user_id": admin.id
#     })

#     return {
#         "access_token": access_token,
#         "token_type": "bearer",
#         "admin": {
#             "id": admin.id,
#             "name": admin.full_name,
#             "email": admin.email
#         }
#     }






from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserRegister, UserLogin
from ..auth import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# Donor and Patient registration only
@router.post("/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    if user.role not in ["donor", "patient"]:
        raise HTTPException(
            status_code=400,
            detail="Only donor and patient can register"
        )

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role,
        phone=user.phone,
        blood_group=user.blood_group,
        gender=user.gender,
        address=user.address
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "role": new_user.role
    }


# Shared login for Admin, Donor, and Patient
@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "sub": db_user.email,
        "role": db_user.role,
        "user_id": db_user.id
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role,
        "user": {
            "id": db_user.id,
            "full_name": db_user.full_name,
            "email": db_user.email,
            "role": db_user.role
        }
    }