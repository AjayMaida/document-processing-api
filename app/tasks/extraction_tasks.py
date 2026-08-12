import logging
from pathlib import Path

from app.celery_app import celery_app
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.document import Document
from app.models.extracted_text import ExtractedText
from app.repositories.extracted_text_repository import ExtractedTextRepository
from app.services.text_extraction_service import TextExtractionService

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def extract_text_task(self, document_id: int) -> dict:
    """
    Celery task: reads the uploaded file from disk, extracts text,
    saves an ExtractedText row, and updates Document.status.

    Retries up to 3 times on failure with a 10-second delay.
    """
    db = SessionLocal()
    try:
        # Fetch the document
        document = db.get(Document, document_id)
        if not document:
            logger.error(f"Document {document_id} not found in extract_text_task")
            return {"status": "error", "detail": "Document not found"}

        # Mark as processing
        document.status = "processing"
        db.commit()

        # Locate file on disk
        file_path = Path(settings.upload_dir) / document.stored_filename
        if not file_path.exists():
            document.status = "error"
            db.commit()
            logger.error(f"File not found on disk: {file_path}")
            return {"status": "error", "detail": "File not found on disk"}

        # Extract text
        extraction_service = TextExtractionService()
        result = extraction_service.extract(file_path, document.stored_filename)

        # Check if record already exists (idempotent)
        repo = ExtractedTextRepository(db)
        existing = repo.get_by_document_id(document_id)

        if existing:
            existing.content = result["content"]
            existing.page_count = result["page_count"]
            existing.word_count = result["word_count"]
        else:
            extracted = ExtractedText(
                document_id=document_id,
                content=result["content"],
                page_count=result["page_count"],
                word_count=result["word_count"],
            )
            repo.create(extracted)

        # Mark document as processed
        document.status = "processed"
        db.commit()

        logger.info(
            f"Extracted text for document {document_id}: "
            f"{result['word_count']} words, {result['page_count']} pages"
        )

        return {
            "status": "success",
            "document_id": document_id,
            "word_count": result["word_count"],
            "page_count": result["page_count"],
        }

    except Exception as exc:
        db.rollback()
        document = db.get(Document, document_id)
        if document:
            document.status = "error"
            db.commit()
        logger.exception(f"Extraction failed for document {document_id}: {exc}")
        raise self.retry(exc=exc)

    finally:
        db.close()
