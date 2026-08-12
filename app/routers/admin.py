from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_admin_user
from app.models.document import Document
from app.models.extracted_text import ExtractedText
from app.models.user import User

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_admin_user)],
)


@router.get(
    "/stats",
    summary="Get system-wide metrics (Admin only)",
)
def get_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_documents = db.query(func.count(Document.id)).scalar() or 0
    completed_docs = (
        db.query(func.count(Document.id))
        .filter(Document.status == "completed")
        .scalar()
        or 0
    )
    pending_docs = (
        db.query(func.count(Document.id))
        .filter(Document.status == "pending")
        .scalar()
        or 0
    )
    total_words = db.query(func.sum(ExtractedText.word_count)).scalar() or 0

    return {
        "total_users": total_users,
        "total_documents": total_documents,
        "completed_extractions": completed_docs,
        "pending_extractions": pending_docs,
        "total_words_extracted": total_words,
    }


@router.get(
    "/users",
    summary="List all registered users (Admin only)",
)
def get_admin_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    users = db.query(User).offset(offset).limit(limit).all()
    total = db.query(func.count(User.id)).scalar() or 0

    user_list = []
    for u in users:
        doc_count = (
            db.query(func.count(Document.id))
            .filter(Document.user_id == u.id)
            .scalar()
            or 0
        )
        user_list.append(
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "is_admin": u.is_admin,
                "created_at": u.created_at,
                "document_count": doc_count,
            }
        )

    return {
        "users": user_list,
        "page": page,
        "limit": limit,
        "total": total,
    }


@router.get(
    "/documents",
    summary="List all documents across all users (Admin only)",
)
def get_admin_documents(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    docs = db.query(Document).offset(offset).limit(limit).all()
    total = db.query(func.count(Document.id)).scalar() or 0

    doc_list = []
    for d in docs:
        doc_list.append(
            {
                "id": d.id,
                "original_filename": d.original_filename,
                "stored_filename": d.stored_filename,
                "status": d.status,
                "user_id": d.user_id,
                "created_at": d.created_at,
            }
        )

    return {
        "documents": doc_list,
        "page": page,
        "limit": limit,
        "total": total,
    }
