from pathlib import Path
from unittest.mock import MagicMock

import pymupdf
import pytest

from app.models.document import Document
from app.services.exceptions import TextExtractionError
from app.services.text_extraction_service import TextExtractionService


def create_service() -> tuple[TextExtractionService, MagicMock]:
    repository = MagicMock()
    service = TextExtractionService(repository)

    return service, repository


def test_extract_txt_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    # Arrange
    upload_dir = tmp_path / "uploads"
    extracted_text_dir = tmp_path / "extracted_texts"

    upload_dir.mkdir()

    document = Document(
        id=1,
        original_filename="example.txt",
        stored_filename="stored-example.txt",
        status="uploaded",
        user_id=1,
    )

    source_file = upload_dir / document.stored_filename
    source_text = "Hello, this is extracted text."

    source_file.write_text(
        source_text,
        encoding="utf-8",
    )

    monkeypatch.setattr(
        "app.services.text_extraction_service.settings.upload_dir",
        str(upload_dir),
    )
    monkeypatch.setattr(
        "app.services.text_extraction_service.settings.extracted_text_dir",
        str(extracted_text_dir),
    )

    service, repository = create_service()

    extracted_record = MagicMock()
    extracted_record.document_id = document.id

    repository.get_by_document_id.return_value = extracted_record

    # Act
    result = service.extract_text(document)

    # Assert
    output_file = (
        extracted_text_dir
        / str(document.id)
        / "extracted.txt"
    )

    assert output_file.exists()
    assert output_file.read_text(encoding="utf-8") == source_text

    assert result is extracted_record

    repository.update_status.assert_any_call(
        extracted_record,
        "processing",
    )
    repository.update_status.assert_any_call(
        extracted_record,
        "completed",
    )

    repository.update_text_path.assert_called_once_with(
        extracted_record,
        str(output_file),
    )

    assert repository.commit.call_count == 2


def test_extract_txt_file_missing_source(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Arrange
    upload_dir = tmp_path / "uploads"

    document = Document(
        id=1,
        original_filename="missing.txt",
        stored_filename="missing.txt",
        status="uploaded",
        user_id=1,
    )

    monkeypatch.setattr(
        "app.services.text_extraction_service.settings.upload_dir",
        str(upload_dir),
    )

    service, repository = create_service()

    # Act / Assert
    with pytest.raises(Exception):
        service.extract_text(document)

    repository.get_by_document_id.assert_not_called()


def test_extract_unsupported_file_type(
    tmp_path: Path,
) -> None:
    # Arrange
    service, _ = create_service()

    document_path = tmp_path / "example.csv"
    document_path.write_text(
        "name,value",
        encoding="utf-8",
    )

    # Act / Assert
    with pytest.raises(Exception):
        service._extract_from_file(document_path)


def test_extract_txt_encoding_error(
    tmp_path: Path,
) -> None:
    # Arrange
    service, _ = create_service()

    document_path = tmp_path / "invalid.txt"

    # Invalid UTF-8 bytes
    document_path.write_bytes(b"\xff\xfe\xfd")

    # Act / Assert
    with pytest.raises(TextExtractionError):
        service._extract_from_file(document_path)




def test_extract_pdf_file(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Arrange
    upload_dir = tmp_path / "uploads"
    extracted_text_dir = tmp_path / "extracted_texts"

    upload_dir.mkdir()

    document = Document(
        id=2,
        original_filename="example.pdf",
        stored_filename="stored-example.pdf",
        status="uploaded",
        user_id=1,
    )

    pdf_path = upload_dir / document.stored_filename

    pdf = pymupdf.open()
    page = pdf.new_page()
    page.insert_text(
        (72, 72),
        "Hello from a PDF document.",
    )
    pdf.save(pdf_path)
    pdf.close()

    monkeypatch.setattr(
        "app.services.text_extraction_service.settings.upload_dir",
        str(upload_dir),
    )
    monkeypatch.setattr(
        "app.services.text_extraction_service.settings.extracted_text_dir",
        str(extracted_text_dir),
    )

    service, repository = create_service()

    extracted_record = MagicMock()
    extracted_record.document_id = document.id

    repository.get_by_document_id.return_value = extracted_record

    # Act
    result = service.extract_text(document)

    # Assert
    output_file = (
        extracted_text_dir
        / str(document.id)
        / "extracted.txt"
    )

    assert output_file.exists()
    assert "Hello from a PDF document." in output_file.read_text(
        encoding="utf-8",
    )

    assert result is extracted_record

    repository.update_status.assert_any_call(
        extracted_record,
        "processing",
    )
    repository.update_status.assert_any_call(
        extracted_record,
        "completed",
    )

    repository.update_text_path.assert_called_once_with(
        extracted_record,
        str(output_file),
    )


from docx import Document as DocxDocument


def test_extract_docx_file(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Arrange
    upload_dir = tmp_path / "uploads"
    extracted_text_dir = tmp_path / "extracted_texts"

    upload_dir.mkdir()

    document = Document(
        id=3,
        original_filename="example.docx",
        stored_filename="stored-example.docx",
        status="uploaded",
        user_id=1,
    )

    docx_path = upload_dir / document.stored_filename

    docx = DocxDocument()
    docx.add_paragraph("Hello from a DOCX document.")
    docx.add_paragraph("This is the second paragraph.")
    docx.save(docx_path)

    monkeypatch.setattr(
        "app.services.text_extraction_service.settings.upload_dir",
        str(upload_dir),
    )
    monkeypatch.setattr(
        "app.services.text_extraction_service.settings.extracted_text_dir",
        str(extracted_text_dir),
    )

    service, repository = create_service()

    extracted_record = MagicMock()
    extracted_record.document_id = document.id

    repository.get_by_document_id.return_value = extracted_record

    # Act
    result = service.extract_text(document)

    # Assert
    output_file = (
        extracted_text_dir
        / str(document.id)
        / "extracted.txt"
    )

    assert output_file.exists()

    extracted_content = output_file.read_text(
        encoding="utf-8",
    )

    assert "Hello from a DOCX document." in extracted_content
    assert "This is the second paragraph." in extracted_content

    assert result is extracted_record

    repository.update_status.assert_any_call(
        extracted_record,
        "processing",
    )
    repository.update_status.assert_any_call(
        extracted_record,
        "completed",
    )

    repository.update_text_path.assert_called_once_with(
        extracted_record,
        str(output_file),
    )