from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
import hashlib

def init_db():
    db = SessionLocal()
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        hashed_password = hashlib.sha256("admin123".encode()).hexdigest()
        new_user = User(
            username="admin",
            password=hashed_password,
            role="admin"
        )
        db.add(new_user)
        db.commit()
        print("Admin user created successfully")
    else:
        print("Admin user already exists")
    db.close()

if __name__ == "__main__":
    init_db()