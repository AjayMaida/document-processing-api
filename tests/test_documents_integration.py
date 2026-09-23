import io

from app.core.config import settings
from app.dependencies import get_storage
from app.models.document import Document
from app.models.extracted_text import ExtractedText


def test_document_lifecycle_integration(client, db_session, authenticated_user):
    """
    Tests the full lifecycle: Upload -> Download -> Delete.
    """
    # Use the actual storage provider configured for the app
    storage = get_storage()

    # 1. Upload a document
    file_content = b"Integration test document content"
    file_name = "integration_test.txt"
    files = {"file": (file_name, io.BytesIO(file_content), "text/plain")}

    response = client.post("/documents/upload", files=files)
    assert response.status_code == 200
    doc_data = response.json()
    doc_id = doc_data["id"]
    stored_filename = doc_data["stored_filename"]

    # 2. Download the document
    download_response = client.get(f"/documents/{doc_id}/download")
    assert download_response.status_code == 200
    assert download_response.content == file_content

    # 3. Delete the document
    delete_response = client.delete(f"/documents/{doc_id}")
    assert delete_response.status_code == 200

    # 4. Verify it's gone (API)
    get_response = client.get(f"/documents/{doc_id}")
    assert get_response.status_code == 404

    # 5. Verify it's gone from storage
    assert storage.exists(stored_filename) is False


def test_get_extracted_text_integration(client, db_session, authenticated_user):
    """
    Tests retrieval of extracted text from the API.
    """
    storage = get_storage()

    # 1. Setup: Create a Document record
    doc = Document(
        original_filename="sample.pdf",
        stored_filename="sample_stored.pdf",
        user_id=authenticated_user.id,
        status="completed",
    )
    db_session.add(doc)
    db_session.flush()

    # 2. Setup: Create the ExtractedText record
    text_content = "This is the extracted text content!"
    text_path = f"extracted/{doc.id}/extracted.txt"

    extracted = ExtractedText(
        document_id=doc.id,
        text_path=text_path,
        status="completed",
    )
    db_session.add(extracted)
    db_session.commit()

    # 3. Setup: Put the actual text file into storage
    storage.upload(io.BytesIO(text_content.encode("utf-8")), text_path)

    # 4. Act: Call the API
    response = client.get(f"/documents/{doc.id}/text")

    # 5. Assert
    assert response.status_code == 200
    assert response.content.decode("utf-8") == text_content


def test_delete_document_removes_extracted_text_from_storage(
    client, db_session, authenticated_user
):
    """
    Ensure deleting a document deletes both original document AND extracted text from storage.
    """
    storage = get_storage()

    doc = Document(
        original_filename="cascade_test.txt",
        stored_filename="cascade_test_stored.txt",
        user_id=authenticated_user.id,
        status="uploaded",
    )
    db_session.add(doc)
    db_session.flush()

    text_path = f"extracted/{doc.id}/extracted.txt"
    extracted = ExtractedText(
        document_id=doc.id,
        text_path=text_path,
        status="completed",
    )
    db_session.add(extracted)
    db_session.commit()

    storage.upload(io.BytesIO(b"original document"), doc.stored_filename)
    storage.upload(io.BytesIO(b"extracted text content"), text_path)

    assert storage.exists(doc.stored_filename) is True
    assert storage.exists(text_path) is True

    response = client.delete(f"/documents/{doc.id}")
    assert response.status_code == 200

    assert storage.exists(doc.stored_filename) is False
    assert storage.exists(text_path) is False


def test_upload_file_size_exceeded(client, authenticated_user, monkeypatch):
    """
    Verify uploading a file that exceeds max_file_size_bytes returns HTTP 413.
    """
    monkeypatch.setattr(settings, "max_file_size_bytes", 100)

    large_content = b"x" * 200
    files = {"file": ("large.txt", io.BytesIO(large_content), "text/plain")}

    response = client.post("/documents/upload", files=files)
    assert response.status_code == 413
    assert "File exceeds maximum allowed size" in response.json()["detail"]


def test_search_documents_by_extracted_text_content(
    client, db_session, authenticated_user
):
    """
    Verify search endpoint matches keyword inside the extracted text file content.
    """
    storage = get_storage()

    doc = Document(
        original_filename="financial_report.pdf",
        stored_filename="financial_report_stored.pdf",
        user_id=authenticated_user.id,
        status="uploaded",
    )
    db_session.add(doc)
    db_session.flush()

    text_path = f"extracted/{doc.id}/extracted.txt"
    extracted = ExtractedText(
        document_id=doc.id,
        text_path=text_path,
        status="completed",
    )
    db_session.add(extracted)
    db_session.commit()

    storage.upload(io.BytesIO(b"Confidential EBITDA revenue projection"), text_path)

    # Search by keyword that appears ONLY in the extracted text, not in filename
    response = client.get("/documents/search?q=ebitda")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["documents"][0]["id"] == doc.id
