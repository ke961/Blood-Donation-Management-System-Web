from sqlalchemy.orm import Session
from app.models import User
from app.auth import hash_password

def create_admin(db: Session):

    admin = db.query(User).filter(User.email == "admin@gmail.com").first()

    if not admin:

        admin = User(
            full_name="Admin",
            email="admin@gmail.com",
            password=hash_password("admin123"),
            role="admin"
        )

        db.add(admin)
        db.commit()