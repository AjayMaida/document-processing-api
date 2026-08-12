from sqlalchemy.orm import Session
from app.core.security import hash_password
from app.models.user import User


def seed_admin_user(db: Session) -> None:
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin = User(
                username="admin",
                email="admin@documind.ai",
                hashed_password=hash_password("admin1234"),
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print("Successfully seeded default admin user (username: admin)")
    except Exception as e:
        db.rollback()
        print(f"Admin seeding warning: {e}")
