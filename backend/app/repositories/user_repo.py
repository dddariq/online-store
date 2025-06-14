from sqlalchemy.orm import Session
from app.models.user import User as ModelUser
from app.schemas.user import UserCreate as SchemaUserCreate

import hashlib

def create_user(db: Session, user: SchemaUserCreate):
    hashed_password = hashlib.sha256(user.password.encode()).hexdigest()
    db_user = ModelUser(
        username=user.username,
        password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    return db.query(ModelUser).filter(ModelUser.username == username).first()

def get_users(db: Session):
    return db.query(ModelUser).order_by(ModelUser.id).all()