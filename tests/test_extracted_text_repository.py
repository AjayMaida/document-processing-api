from app.models.extracted_text import ExtractedText
from app.models.document import Document
from app.models.user import User
from app.repositories.extracted_text_repository import ExtractedTextRepository


def test_create_extracted_text(db_session,document):


    repository = ExtractedTextRepository(db_session)

    extracted_text = ExtractedText(
        document_id=document.id,
        status="processing",
    )

    result = repository.create(extracted_text)

    assert result.id is not None
    assert result.document_id == document.id
    assert result.status == "processing"


def test_get_extracted_text_by_documnet_id(db_session,document):

    repository = ExtractedTextRepository(db_session)

    extracted_text = ExtractedText(
        document_id = document.id,
        status = "processing",
    )

    repository.create(extracted_text)

    result = repository.get_by_document_id(document.id)

    assert result is not None
    assert result.id == extracted_text.id
    assert result.document_id == document.id
    assert result.status == "processing"

def test_get_extracted_text_by_document_id_returns_none(db_session):
    repository = ExtractedTextRepository(db_session)

    result = repository.get_by_document_id(999)

    assert result is None

def test_update_extracted_text_status(db_session,document):
    repository = ExtractedTextRepository(db_session)

    extracted_text = ExtractedText(
        document_id = document.id,
        status="processing",
    )

    repository.create(extracted_text)

    repository.update_status(extracted_text,"completed")

    result = repository.get_by_document_id(document.id)

    assert result is not None
    assert result.status == "completed"

def test_update_extracted_text_status(db_session, document):
    repository = ExtractedTextRepository(db_session)

    extracted_text = ExtractedText(
        document_id=document.id,
        status="processing",
    )

    repository.create(extracted_text)

    repository.update_status(
        extracted_text,
        "completed",
    )

    result = repository.get_by_document_id(document.id)

    assert result is not None
    assert result.status == "completed"


def test_update_extracted_text_path(db_session, document):
    repository = ExtractedTextRepository(db_session)

    extracted_text = ExtractedText(
        document_id=document.id,
        status="processing",
    )

    repository.create(extracted_text)

    repository.update_text_path(
        extracted_text,
        "extracted/document_1.txt",
    )

    result = repository.get_by_document_id(document.id)

    assert result is not None
    assert result.text_path == "extracted/document_1.txt"