from fastapi import Depends,HTTPException,status
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.core.security import decode_access_token
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.document_repository import DocumentRepository
from app.services.document_service import DocumentService

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer_scheme = HTTPBearer()


def get_document_repository(
    db: Session = Depends(get_db),
) -> DocumentRepository:
    return DocumentRepository(db)


def get_document_service(
    repository: DocumentRepository = Depends(get_document_repository),
) -> DocumentService:
    return DocumentService(repository)

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
            detail="Invalid or expired access toekn",
        
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