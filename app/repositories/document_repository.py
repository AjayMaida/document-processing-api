from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.document import Document


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

    def delete_document(
        self,
        document: Document,
    ) -> None:

        self.db.delete(document)
        self.db.flush()
