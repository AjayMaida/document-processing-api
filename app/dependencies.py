# ---------------------------------------------------------------------------
# Standard library imports
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Third-party imports
# ---------------------------------------------------------------------------
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# Local application imports
# ---------------------------------------------------------------------------
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.document_repository import DocumentRepository
from app.repositories.extracted_text_repository import ExtractedTextRepository
from app.repositories.user_repository import UserRepository
from app.services.document_service import DocumentService

# HTTP Bearer authentication scheme.
# FastAPI uses this to extract the access token from:
# Authorization: Bearer <token>
bearer_scheme = HTTPBearer()


# ---------------------------------------------------------------------------
# Document dependencies
# ---------------------------------------------------------------------------


# Creates a DocumentRepository using the database session provided by FastAPI.
#
# Dependency flow:
# get_db() → DocumentRepository
def get_document_repository(
    db: Session = Depends(get_db),
) -> DocumentRepository:
    return DocumentRepository(db)


# Creates a DocumentService using the DocumentRepository above.
#
# Dependency flow:
# get_db()
#    ↓
# DocumentRepository
#    ↓
# DocumentService
def get_document_service(
    repository: DocumentRepository = Depends(get_document_repository),
) -> DocumentService:
    return DocumentService(repository)


# ---------------------------------------------------------------------------
# Extracted text dependencies
# ---------------------------------------------------------------------------


# Creates an ExtractedTextRepository using the database session.
#
# This repository is responsible only for database operations related
# to extracted text records.
#
# Dependency flow:
# get_db() → ExtractedTextRepository
def get_extracted_text_repository(
    db: Session = Depends(get_db),
) -> ExtractedTextRepository:
    return ExtractedTextRepository(db)


# ---------------------------------------------------------------------------
# Authentication dependency
# ---------------------------------------------------------------------------


# Returns the currently authenticated user.
#
# Flow:
# 1. Read Bearer token from request
# 2. Decode and validate the JWT
# 3. Extract user ID from token
# 4. Find the user in the database
# 5. Return the User object
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:

    token = credentials.credentials

    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )

    user_repository = UserRepository(db)
    user = user_repository.get_by_id(int(user_id))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user
