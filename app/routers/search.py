from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.search import SearchResponse
from app.services.search_service import SearchService

router = APIRouter(
    prefix="/search",
    tags=["Search"],
)


@router.get(
    "",
    response_model=SearchResponse,
    summary="Search documents",
    description=(
        "Full-text search across your documents. "
        "Searches both the original filename and the extracted text content. "
        "Returns paginated results with a context snippet around the match."
    ),
)
def search_documents(
    q: str = Query(..., min_length=1, description="Search query string"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SearchResponse:
    service = SearchService(db)
    return service.search(
        query=q,
        user_id=user.id,
        page=page,
        limit=limit,
    )
