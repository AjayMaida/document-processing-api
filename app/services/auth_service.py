from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_jwt_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse,
)


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repository = UserRepository(db)
        self.refresh_token_repository = RefreshTokenRepository(db)

    def register(
        self,
        request: RegisterRequest,
    ) -> RegisterResponse:

        exsting_user = self.user_repository.get_by_username(request.username)
        if exsting_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Username already exists"
            )
        exsting_email = self.user_repository.get_by_email(request.email)
        if exsting_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists",
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

    def login(self, request: LoginRequest) -> LoginResponse:
        existing_user = self.user_repository.get_by_username(request.username)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )
        if not verify_password(request.password, existing_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )
        access_token = create_jwt_token(existing_user.id)
        refresh_token = create_refresh_token()
        refresh_token_hash = hash_refresh_token(refresh_token)
        now = datetime.now(UTC)

        expires_at = now + timedelta(days=settings.refresh_token_expire_days)
        refresh_token_record = RefreshToken(
            user_id=existing_user.id,
            token_hash=refresh_token_hash,
            expires_at=expires_at,
        )

        try:
            self.refresh_token_repository.create(refresh_token_record)

            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )

    def refresh_access_token(
        self,
        request: RefreshTokenRequest,
    ) -> RefreshTokenRepository:
        token_hash = hash_refresh_token(request.refresh_token)
        existing_token = self.refresh_token_repository.get_by_hash(token_hash)
        if not existing_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        if existing_token.revoked_at is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
            )
        if existing_token.expires_at < datetime.now(UTC):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired",
            )

        access_token = create_jwt_token(existing_token.user_id)
        new_refresh_token = create_refresh_token()
        new_refresh_token_hash = hash_refresh_token(new_refresh_token)
        new_expires_at = datetime.now(UTC) + timedelta(
            days=settings.refresh_token_expire_days
        )
        new_refresh_token_record = RefreshToken(
            user_id=existing_token.user_id,
            token_hash=new_refresh_token_hash,
            expires_at=new_expires_at,
        )

        try:
            existing_token.revoked_at = datetime.now(UTC)
            self.refresh_token_repository.create(new_refresh_token_record)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        return RefreshTokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
        )
