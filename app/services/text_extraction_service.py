from pathlib import Path
import pymupdf
from docx import Document as DocxDocument
from fastapi import HTTPException, status

from app.core.config import settings
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
    - Persist extracted text outside the database.
    - Update extraction status and storage path.

    Database operations are delegated to ExtractedTextRepository.
    """

    def __init__(self, repository: ExtractedTextRepository) -> None:
        self.repository = repository

    def extract_text(self, document: Document) -> ExtractedText:
        """
        Extract text from a document and persist the extraction result.

        The extracted content itself is stored as a .txt file rather than
        in PostgreSQL. The database stores only its metadata and file path.

        Raises:
            HTTPException: If the source document does not exist or the
                document type is unsupported.
            Exception: Propagates extraction/storage failures after marking
                the extraction as failed.
        """
        document_path = self._get_document_path(document)

        if not document_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found.",
            )

        extracted_text = self._get_or_create_extraction(document)

        try:
            self.repository.update_status(
                extracted_text,
                "processing",
            )
            self.repository.commit()

            text = self._extract_from_file(document_path)

            text_path = self._save_extracted_text(
                document.id,
                text,
            )

            self.repository.update_text_path(
                extracted_text,
                str(text_path),
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

    def _get_document_path(self, document: Document) -> Path:
        """Return the filesystem path of the uploaded document."""
        return Path(settings.upload_dir) / document.stored_filename

    def _get_or_create_extraction(
        self,
        document: Document,
    ) -> ExtractedText:
        """
        Return the existing extraction record or create a new one.

        Having a single extraction record per document keeps extraction
        state and retry behavior easy to manage.
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

    def _extract_from_file(self, document_path: Path) -> str:
        """Dispatch extraction to the appropriate file-type handler."""
        extension = document_path.suffix.lower()

        try:
            if extension == ".txt":
                return self._extract_from_txt(document_path)

            if extension == ".pdf":
                return self._extract_from_pdf(document_path)

            if extension == ".docx":
                return self._extract_from_docx(document_path)

        except (OSError, UnicodeError) as exc:
            raise TextExtractionError(
                f"Failed to extract text from {document_path.name}",
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported document type: {extension}",
        )

    def _extract_from_txt(self, document_path: Path) -> str:
        """Read text directly from a plain-text document."""
        return document_path.read_text(encoding="utf-8")

    def _extract_from_pdf(self, document_path: Path) -> str:
        """Extract text from a PDF document."""
  
        with pymupdf.open(document_path) as pdf:
            return "\n".join(
                page.get_text()
                for page in pdf
            )

    def _extract_from_docx(self, document_path: Path) -> str:
        """Extract text from a DOCX document."""
        document = DocxDocument(document_path)

        return "\n".join(
            paragraph.text
            for paragraph in document.paragraphs
            if paragraph.text.strip()
        )

    def _save_extracted_text(
        self,
        document_id: int,
        text: str,
    ) -> Path:
        """
        Persist extracted text outside PostgreSQL.

        Each document gets its own directory so that we can later support
        additional extraction artifacts or versions without changing the
        storage layout.
        """
        output_dir = (
            Path(settings.extracted_text_dir)
            / str(document_id)
        )
        output_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        text_path = output_dir / "extracted.txt"

        text_path.write_text(
            text,
            encoding="utf-8",
        )

        return text_path

    def _mark_as_failed(self, document_id: int) -> None:
        """
        Mark the extraction as failed when processing raises an exception.

        Failure to update the status should not hide the original extraction
        exception, so this method intentionally handles its own errors.
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