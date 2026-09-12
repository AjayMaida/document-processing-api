"""Background tasks package."""

from app.tasks.extraction_tasks import extract_document_text

__all__ = [
    "extract_document_text",
]
