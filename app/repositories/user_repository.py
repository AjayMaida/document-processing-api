from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username)
        return self.db.scalar(stmt)

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.db.scalar(stmt)

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)
        return user

    def get_by_id(self, user_id: int) -> User | None:
        stmt = select(User).where(User.id == user_id)
        return self.db.scalar(stmt)

    def list_users(
        self,
        offset: int,
        limit: int,
    ) -> list[User]:
        stmt = select(User).order_by(User.created_at.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).all())

    def count_users(self) -> int:
        stmt = select(func.count()).select_from(User)
        return self.db.scalar(stmt) or 0

    def update_role(self, user_id: int, role: str) -> None:
        stmt = select(User).where(User.id == user_id)
        user = self.db.scalar(stmt)
        if user:
            user.role = role
            self.db.flush()
