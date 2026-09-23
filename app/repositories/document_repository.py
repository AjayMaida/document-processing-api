from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.extracted_text import ExtractedText


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

    def create(self, document: Document) -> Document:
        self.db.add(document)
        self.db.flush()
        self.db.refresh(document)

        return document

    def get_documents(
        self,
        offset: int,
        limit: int,
        user_id: int,
    ) -> list[Document]:

        stmt = (
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        return list(self.db.scalars(stmt).all())

    def get_all_documents(
        self,
        user_id: int,
    ) -> int:

        stmt = (
            select(func.count())
            .select_from(Document)
            .where(Document.user_id == user_id)
        )

        return self.db.scalar(stmt) or 0

    def get_document_by_id(
        self,
        document_id: int,
        user_id: int,
    ) -> Document | None:

        stmt = select(Document).where(
            Document.id == document_id,
            Document.user_id == user_id,
        )

        return self.db.scalar(stmt)

    def search_documents(
        self,
        query: str,
        user_id: int,
    ) -> list[Document]:
        """
        Search for documents by filename.
        """
        stmt = (
            select(Document)
            .where(
                Document.user_id == user_id,
                Document.original_filename.ilike(f"%{query}%"),
            )
            .order_by(Document.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def get_documents_with_extracted_text(
        self,
        user_id: int,
    ) -> list[Document]:
        """
        Return documents belonging to user that have completed text extraction.
        """
        stmt = (
            select(Document)
            .join(Document.extracted_text)
            .where(
                Document.user_id == user_id,
                ExtractedText.status == "completed",
                ExtractedText.text_path.isnot(None),
            )
            .order_by(Document.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def delete_document(
        self,
        document: Document,
    ) -> None:
        # Delete associated extracted text first to avoid IntegrityError
        # on the NOT NULL document_id column.
        self.db.execute(
            delete(ExtractedText).where(ExtractedText.document_id == document.id)
        )

        self.db.delete(document)
        self.db.flush()
