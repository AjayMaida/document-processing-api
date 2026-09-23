import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings
from app.core.logging import logger
from app.core.storage.base import StorageInterface
from app.models.document import Document
from app.models.user import User
from app.repositories.document_repository import DocumentRepository
from app.tasks.extraction_tasks import extract_document_text


class DocumentService:
    def __init__(self, repository: DocumentRepository, storage: StorageInterface):
        self.repository = repository
        self.storage = storage

    def _validate_file(self, file: UploadFile) -> None:
        if file.content_type not in settings.allowed_content_types:
            raise HTTPException(status_code=400, detail="Invalid file type")

        if not Path(file.filename).suffix.lower() in settings.allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid file extension")

        # Validate file size
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)

        if size > settings.max_file_size_bytes:
            max_mb = settings.max_file_size_bytes // (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed size of {max_mb}MB",
            )

    def _generate_filename(self, filename: str) -> str:
        extension = Path(filename).suffix
        return f"{uuid.uuid4()}{extension}"

    async def upload_document(
        self,
        file: UploadFile,
        current_user: User,
    ) -> Document:
        self._validate_file(file)
        stored_filename = self._generate_filename(file.filename)

        self.storage.upload(file.file, stored_filename)

        document = Document(
            original_filename=file.filename,
            stored_filename=stored_filename,
            status="uploaded",
            user_id=current_user.id,
        )

        try:
            created_document = self.repository.create(document)
            self.repository.commit()
            extract_document_text.delay(
                created_document.id,
                current_user.id,
            )
            return created_document
        except Exception:
            self.repository.rollback()
            self.storage.delete(stored_filename)
            raise

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

    def get_document_status(
        self,
        document_id: int,
        user_id: int,
    ) -> dict:
        """
        Retrieve the combined status of a document and its extraction process.
        """
        document = self.get_document_by_id(document_id, user_id)

        status_info = {
            "document_id": document.id,
            "document_status": document.status,
            "extraction_status": "not_started",
        }

        if document.extracted_text:
            status_info["extraction_status"] = document.extracted_text.status

        return status_info

    def search_documents(
        self,
        query: str,
        user_id: int,
    ) -> list[Document]:
        """
        Search for documents by filename or matching content in extracted text.
        """
        filename_matches = self.repository.search_documents(query, user_id)
        matched_ids = {doc.id for doc in filename_matches}
        results = list(filename_matches)

        query_lower = query.lower()
        extracted_docs = self.repository.get_documents_with_extracted_text(user_id)
        for doc in extracted_docs:
            if doc.id in matched_ids:
                continue
            if doc.extracted_text and doc.extracted_text.text_path:
                try:
                    if self.storage.exists(doc.extracted_text.text_path):
                        stream = self.storage.download(doc.extracted_text.text_path)
                        content = stream.read().decode("utf-8", errors="ignore").lower()
                        if query_lower in content:
                            results.append(doc)
                            matched_ids.add(doc.id)
                except (OSError, UnicodeDecodeError, KeyError) as exc:
                    logger.warning(
                        "Could not read extracted text for document %s: %s",
                        doc.id,
                        exc,
                    )

        return results

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

        extracted_text_path = (
            document.extracted_text.text_path
            if document.extracted_text and document.extracted_text.text_path
            else None
        )
        stored_filename = document.stored_filename

        try:
            self.storage.delete(stored_filename)
            if extracted_text_path:
                self.storage.delete(extracted_text_path)
        except (OSError, KeyError) as exc:
            logger.error("Failed to delete file from storage: %s", exc)
            raise HTTPException(
                status_code=500, detail="Failed to delete document file"
            ) from exc

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

        if not self.storage.exists(document.stored_filename):
            raise HTTPException(status_code=404, detail="Document file not found")

        return document

    def get_extracted_text(
        self,
        document_id: int,
        user_id: int,
    ) -> Document:
        """
        Retrieve the document to access its associated extracted text.
        The caller (router) will use the returned document to fetch the stream from storage.
        """
        document = self.get_document_by_id(document_id, user_id)

        if document.extracted_text is None:
            raise HTTPException(
                status_code=404,
                detail="No extracted text found for this document",
            )

        if document.extracted_text.status != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Extraction is not complete. Current status: {document.extracted_text.status}",
            )

        if not document.extracted_text.text_path:
            raise HTTPException(
                status_code=500,
                detail="Extraction completed but no text path was saved",
            )

        return document
