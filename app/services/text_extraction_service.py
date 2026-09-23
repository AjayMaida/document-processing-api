import io
from pathlib import Path
from typing import BinaryIO

import pymupdf
from docx import Document as DocxDocument
from fastapi import HTTPException, status

from app.core.storage.base import StorageInterface
from app.models.document import Document
from app.models.extracted_text import ExtractedText
from app.repositories.extracted_text_repository import ExtractedTextRepository
from app.services.exceptions import TextExtractionError


class TextExtractionService:
    """
    Handles document text extraction and extracted-text storage.

    Responsibilities:
    - Validate that the source document exists.
    - Create/manage the ExtractedText database record.
    - Extract text based on the document type.
    - Persist extracted text via the storage provider.
    - Update extraction status and storage path.

    Database operations are delegated to ExtractedTextRepository.
    """

    def __init__(
        self, repository: ExtractedTextRepository, storage: StorageInterface
    ) -> None:
        self.repository = repository
        self.storage = storage

    def extract_text(self, document: Document) -> ExtractedText:
        """
        Extract text from a document and persist the extraction result.

        The extracted content itself is stored via the storage provider.
        The database stores only its metadata and the stored path.

        Raises:
            HTTPException: If the source document does not exist or the
                document type is unsupported.
            Exception: Propagates extraction/storage failures after marking
                the extraction as failed.
        """
        # Get file stream from storage instead of local Path
        try:
            file_stream = self.storage.download(document.stored_filename)
        except FileNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found in storage.",
            )

        extracted_text = self._get_or_create_extraction(document)

        try:
            self.repository.update_status(
                extracted_text,
                "processing",
            )
            self.repository.commit()

            # Pass the stream to the extractor
            text = self._extract_from_stream(file_stream, document.stored_filename)

            # Save the result back to storage
            stored_text_path = self._save_extracted_text(
                document.id,
                text,
            )

            self.repository.update_text_path(
                extracted_text,
                stored_text_path,
            )
            self.repository.update_status(
                extracted_text,
                "completed",
            )
            self.repository.commit()

            return extracted_text

        except TextExtractionError:
            self.repository.rollback()
            self._mark_as_failed(document.id)
            raise
        finally:
            # Ensure the stream is closed
            file_stream.close()

    def _get_or_create_extraction(
        self,
        document: Document,
    ) -> ExtractedText:
        """
        Return the existing extraction record or create a new one.
        """
        extracted_text = self.repository.get_by_document_id(
            document.id,
        )

        if extracted_text is not None:
            return extracted_text

        extracted_text = ExtractedText(
            document_id=document.id,
            status="pending",
        )

        return self.repository.create(extracted_text)

    def _extract_from_stream(self, file_stream: BinaryIO, filename: str) -> str:
        """Dispatch extraction based on filename extension."""
        extension = Path(filename).suffix.lower()

        try:
            if extension == ".txt":
                return self._extract_from_txt(file_stream)

            if extension == ".pdf":
                return self._extract_from_pdf(file_stream)

            if extension == ".docx":
                return self._extract_from_docx(file_stream)

        except (OSError, UnicodeError) as exc:
            raise TextExtractionError(
                f"Failed to extract text from {filename}",
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported document type: {extension}",
        )

    def _extract_from_txt(self, file_stream: BinaryIO) -> str:
        """Read text directly from a binary stream."""
        return file_stream.read().decode("utf-8")

    def _extract_from_pdf(self, file_stream: BinaryIO) -> str:
        """Extract text from a PDF binary stream."""
        # pymupdf expects bytes or bytearray for the stream parameter
        with pymupdf.open(stream=file_stream.read(), filetype="pdf") as pdf:
            return "\n".join(page.get_text() for page in pdf)

    def _extract_from_docx(self, file_stream: BinaryIO) -> str:
        """Extract text from a DOCX binary stream."""
        document = DocxDocument(file_stream)

        return "\n".join(
            paragraph.text
            for paragraph in document.paragraphs
            if paragraph.text.strip()
        )

    def _save_extracted_text(
        self,
        document_id: int,
        text: str,
    ) -> str:
        """
        Persist extracted text via the storage provider.

        Stored as: extracted/{document_id}/extracted.txt
        """
        stored_path = f"extracted/{document_id}/extracted.txt"

        # Convert text to binary stream for the storage provider
        content = io.BytesIO(text.encode("utf-8"))

        return self.storage.upload(content, stored_path)

    def _mark_as_failed(self, document_id: int) -> None:
        """
        Mark the extraction as failed when processing raises an exception.
        """
        try:
            extracted_text = self.repository.get_by_document_id(
                document_id,
            )

            if extracted_text is None:
                return

            self.repository.update_status(
                extracted_text,
                "failed",
            )
            self.repository.commit()

        except (OSError, RuntimeError):
            self.repository.rollback()
