from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey

from sqlalchemy.orm import relationship

from datetime import datetime

from .database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String, nullable=False)

    email = Column(String, unique=True, index=True)

    password = Column(String, nullable=False)

    role = Column(String, nullable=False)

    phone = Column(String)

    blood_group = Column(String)

    gender = Column(String)

    address = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)


class BloodRequest(Base):

    __tablename__ = "blood_requests"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(Integer, ForeignKey("users.id"))

    blood_group = Column(String)

    hospital = Column(String)

    quantity = Column(Integer)

    status = Column(String, default="Pending")

    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User")


class Donation(Base):

    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)

    donor_id = Column(Integer, ForeignKey("users.id"))

    request_id = Column(Integer, ForeignKey("blood_requests.id"))

    donation_date = Column(DateTime, default=datetime.utcnow)

    status = Column(String, default="Completed")

    donor = relationship("User")

    request = relationship("BloodRequest")