from pathlib import Path

import pytest

from app.core.config import settings
from app.models.document import Document
from app.models.extracted_text import ExtractedText
from app.models.user import User
from app.tasks.extraction_tasks import extract_document_text


def test_extract_document_text_task_success(
    db_session,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    upload_dir = tmp_path / "uploads"
    extracted_text_dir = tmp_path / "extracted_texts"
    upload_dir.mkdir()
    extracted_text_dir.mkdir()

    monkeypatch.setattr(settings, "upload_dir", str(upload_dir))
    monkeypatch.setattr(settings, "extracted_text_dir", str(extracted_text_dir))

    user = User(
        username="taskuser",
        email="taskuser@example.com",
        hashed_password="hashed-password",
    )
    db_session.add(user)
    db_session.flush()

    stored_filename = "task-sample.txt"
    source_file = upload_dir / stored_filename
    source_file.write_text("Celery background task content", encoding="utf-8")

    document = Document(
        original_filename="sample.txt",
        stored_filename=stored_filename,
        status="uploaded",
        user_id=user.id,
    )
    db_session.add(document)
    db_session.commit()

    # Trigger task via Celery delay (runs synchronously under task_always_eager=True)
    result = extract_document_text.delay(document.id, user.id)

    assert result.successful()

    # Verify extracted text record in DB
    extracted_record = (
        db_session.query(ExtractedText)
        .filter(ExtractedText.document_id == document.id)
        .first()
    )
    assert extracted_record is not None
    assert extracted_record.status == "completed"
    assert extracted_record.text_path is not None

    # Verify extracted file content on disk
    saved_file = Path(extracted_record.text_path)
    assert saved_file.exists()
    assert saved_file.read_text(encoding="utf-8") == "Celery background task content"


def test_extract_document_text_task_nonexistent_document(db_session):
    result = extract_document_text.delay(99999, 99999)
    assert result.successful()
