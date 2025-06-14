from app.db.session import SessionLocal
from app.db.models import User
from app.core.security import get_password_hash

def init_db():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "admin@example.com").first()
    if not user:
        new_user = User(
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            is_active=True,
            is_superuser=True
        )
        db.add(new_user)
        db.commit()
        print("Admin user created")
    else:
        print("Admin user already exists")
    db.close()

if __name__ == "__main__":
    init_db()

