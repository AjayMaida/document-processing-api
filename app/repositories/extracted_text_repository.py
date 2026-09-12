from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.extracted_text import ExtractedText


class ExtractedTextRepository:
    def __init__(self, db: Session):
        self.db = db

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

    def create(
        self,
        extracted_text: ExtractedText,
    ) -> ExtractedText:
        self.db.add(extracted_text)
        self.db.flush()
        self.db.refresh(extracted_text)

        return extracted_text

    def get_by_document_id(
        self,
        document_id: int,
    ) -> ExtractedText | None:

        stmt = select(ExtractedText).where(
            ExtractedText.document_id == document_id,
        )

        return self.db.scalar(stmt)

    def update_status(
        self,
        extracted_text: ExtractedText,
        status: str,
    ) -> None:

        extracted_text.status = status
        self.db.flush()

    def update_text_path(
        self,
        extracted_text: ExtractedText,
        text_path: str,
    ) -> None:

        extracted_text.text_path = text_path
        self.db.flush()
