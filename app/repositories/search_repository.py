from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.extracted_text import ExtractedText


class SearchRepository:
    def __init__(self, db: Session):
        self.db = db

    def search(
        self,
        query: str,
        user_id: int,
        offset: int,
        limit: int,
    ) -> list[tuple[Document, ExtractedText | None]]:
        """
        Search documents by original_filename (ILIKE) OR
        extracted text content (ILIKE), scoped to user_id.
        Returns a list of (Document, ExtractedText | None) tuples.
        """
        stmt = (
            select(Document, ExtractedText)
            .outerjoin(ExtractedText, ExtractedText.document_id == Document.id)
            .where(
                Document.user_id == user_id,
                or_(
                    Document.original_filename.ilike(f"%{query}%"),
                    ExtractedText.content.ilike(f"%{query}%"),
                ),
            )
            .order_by(Document.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(self.db.execute(stmt).all())

    def count(self, query: str, user_id: int) -> int:
        """
        Total count of matching documents for pagination.
        """
        stmt = (
            select(func.count(Document.id))
            .outerjoin(ExtractedText, ExtractedText.document_id == Document.id)
            .where(
                Document.user_id == user_id,
                or_(
                    Document.original_filename.ilike(f"%{query}%"),
                    ExtractedText.content.ilike(f"%{query}%"),
                ),
            )
        )
        return self.db.scalar(stmt) or 0
