import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings
from app.models.document import Document
from app.models.user import User
from app.repositories.document_repository import DocumentRepository


class DocumentService:
    def __init__(self, repository: DocumentRepository):
        self.repository = repository

    def _validate_file(self, file: UploadFile) -> None:
        ext = Path(file.filename).suffix.lower() if file.filename else ""
        if ext not in settings.allowed_extensions and file.content_type not in settings.allowed_content_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{ext}'. Allowed extensions: {settings.allowed_extensions}",
            )

    def _generate_filename(self, filename: str) -> str:
        extention = Path(filename).suffix
        return f"{uuid.uuid4()}{extention}"

    async def upload_document(
        self,
        file: UploadFile,
        current_user: User,
    ) -> Document:
        self._validate_file(file)
        stored_filename = self._generate_filename(file.filename)
        destination = Path(settings.upload_dir) / stored_filename

        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        document = Document(
            original_filename=file.filename,
            stored_filename=stored_filename,
            status="pending",
            user_id=current_user.id,
        )

        try:
            created_document = self.repository.create(document)
            self.repository.commit()
        except Exception:
            self.repository.rollback()
            if destination.exists():
                destination.unlink()
            raise

        # Dispatch async text extraction task safely
        try:
            from app.tasks.extraction_tasks import extract_text_task
            extract_text_task.delay(created_document.id)
        except Exception as e:
            print(f"Celery dispatch warning: {e}")

        return created_document

    def get_documents(
        self,
        page: int,
        limit: int,
        user_id: int,
    ) -> dict:
        offset = (page - 1) * limit

        documents = self.repository.get_documents(
            offset,
            limit,
            user_id,
        )

        total = self.repository.get_all_documents(user_id)

        return {
            "documents": documents,
            "page": page,
            "limit": limit,
            "total": total,
        }

    def get_document_by_id(
        self,
        document_id: int,
        user_id: int,
    ) -> Document:

        document = self.repository.get_document_by_id(
            document_id=document_id,
            user_id=user_id,
        )

        if document is None:
            raise HTTPException(
                status_code=404,
                detail="Document not found",
            )

        return document

    def delete_document(
        self,
        document_id: int,
        user_id: int,
    ) -> None:

        document = self.repository.get_document_by_id(document_id, user_id=user_id)

        if document is None:
            raise HTTPException(
                status_code=404,
                detail="Document not found",
            )

        file_path = Path(settings.upload_dir) / document.stored_filename

        try:
            file_path.unlink()
        except PermissionError:
            raise HTTPException(
                status_code=500,
                detail="Permission denied while deleting document file",
            )
        except OSError:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete document file",
            )
        try:
            self.repository.delete_document(document)
            self.repository.commit()

        except Exception:
            self.repository.rollback()
            raise

    def download_document(
        self,
        document_id: int,
        user_id: int,
    ) -> Document:

        document = self.repository.get_document_by_id(document_id, user_id)

        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")

        file_path = Path(settings.upload_dir) / document.stored_filename

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Document file not found")

        return document

    def get_document_text(
        self,
        document_id: int,
        user_id: int,
    ):
        # Verify document ownership first
        document = self.repository.get_document_by_id(document_id, user_id)

        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")

        from app.repositories.extracted_text_repository import ExtractedTextRepository

        db = self.repository.db
        extracted_repo = ExtractedTextRepository(db)
        extracted = extracted_repo.get_by_document_id(document_id)

        if extracted is None:
            if document.status == "processing":
                raise HTTPException(
                    status_code=202,
                    detail="Text extraction is still in progress. Please try again shortly.",
                )
            raise HTTPException(
                status_code=404,
                detail="Extracted text not found for this document.",
            )

        return extracted
