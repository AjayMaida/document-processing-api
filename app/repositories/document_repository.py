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