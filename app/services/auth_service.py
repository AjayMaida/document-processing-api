from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, RegisterResponse
from app.models.user import User
from app.core.security import hash_password
from fastapi import HTTPException,status


class AuthService:

    def __init__(self, db: Session):
        self.db = db
        self.user_repository = UserRepository(db)


    def register(self, request: RegisterRequest,) -> RegisterResponse:

        exsting_user = self.user_repository.get_by_username(request.username)
        if exsting_user:
            raise HTTPException(
                status_code = status.HTTP_409_CONFLICT,
                detail = "Username already exists"
            )
        exsting_email = self.user_repository.get_by_email(request.email)
        if exsting_email:
            raise HTTPException(
                status_code = status.HTTP_409_CONFLICT,
                detail = "Email already exists", 
            )
        
        user = User(
            username=request.username,
            email=request.email,
            hashed_password=hash_password(request.password),
            )
        
        try:
            created_user = self.user_repository.create(user)

            self.db.commit()

            return created_user
        except Exception:
            self.db.rollback()
            raise