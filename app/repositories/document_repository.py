from sqlalchemy.orm import Session

from app.models.document import Document


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db


    def create(self, document: Document)->Document:
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def get_documents(
            self,
            offset: int,
            limit: int,
    ) -> list[Document]:
        return (
            self.db.query(Document)
            .order_by(Document.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def get_all_documents(
        self,
    ) -> int:
        return self.db.query(Document).count()


    def get_document_by_id(
            self,
            document_id: int,

    )-> Document | None:
        return (
            self.db.query(Document)
            .filter(Document.id == document_id)
            .first()
        )    
    def delete_document(
            self,
            document:Document
    ):
        self.db.delete(document)
        self.db.commit()
