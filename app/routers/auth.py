from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, RegisterResponse,RefreshTokenRequest, RefreshTokenResponse
from app.services.auth_service import AuthService, LoginRequest

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
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