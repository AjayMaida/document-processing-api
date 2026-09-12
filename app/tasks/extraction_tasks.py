"""Background tasks for document text extraction."""

# Standard library imports

# Local application imports
from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.repositories.document_repository import DocumentRepository
from app.repositories.extracted_text_repository import ExtractedTextRepository
from app.services.text_extraction_service import TextExtractionService


@celery_app.task(
    name="tasks.extract_document_text",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def extract_document_text(self, document_id: int, user_id: int) -> None:
    """Extract text from a document in a Celery background task.

    The task creates its own database session because it runs independently
    from the HTTP request that triggered it in a dedicated worker process.
    """

    db = SessionLocal()

    try:
        document_repository = DocumentRepository(db)
        extracted_text_repository = ExtractedTextRepository(db)

        document = document_repository.get_document_by_id(
            document_id=document_id,
            user_id=user_id,
        )

        if document is None:
            return

        text_extraction_service = TextExtractionService(
            extracted_text_repository,
        )

        text_extraction_service.extract_text(document)

    finally:
        db.close()
