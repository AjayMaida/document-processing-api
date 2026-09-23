from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse,
    UserResponse,
)
from app.services.auth_service import AuthService, LoginRequest

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

user_router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.post(
    "/register",
    response_model=RegisterResponse,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    return service.register(request)


@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    return service.login(request)


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
)
def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)

    return service.refresh_access_token(request)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@user_router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_user_me(
    current_user: User = Depends(get_current_user),
):
    return current_user
