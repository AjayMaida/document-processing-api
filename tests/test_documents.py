"""
Tests for document endpoints:
  - POST /documents/upload
  - GET  /documents
  - GET  /documents/{id}
  - DELETE /documents/{id}
  - GET  /documents/{id}/download
  - GET  /documents/{id}/text

Covers: happy paths, auth enforcement, ownership isolation,
        invalid inputs, and missing resource handling.
"""

import io
from unittest.mock import patch

from tests.conftest import make_txt_upload


# ============================================================
# Upload
# ============================================================


def test_upload_document_success(client, auth_headers):
    with patch("app.tasks.extraction_tasks.extract_text_task.delay"):
        response = client.post(
            "/documents/upload",
            files=make_txt_upload("report.txt", "Annual report content here."),
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["original_filename"] == "report.txt"
    assert data["status"] == "uploaded"
    assert data["id"] is not None


def test_upload_document_requires_auth(client):
    response = client.post(
        "/documents/upload",
        files=make_txt_upload(),
    )
    assert response.status_code == 401


def test_upload_document_invalid_content_type(client, auth_headers):
    response = client.post(
        "/documents/upload",
        files={"file": ("malware.exe", io.BytesIO(b"MZ..."), "application/octet-stream")},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_upload_document_invalid_extension(client, auth_headers):
    response = client.post(
        "/documents/upload",
        files={"file": ("file.xyz", io.BytesIO(b"data..."), "text/plain")},
        headers=auth_headers,
    )
    assert response.status_code == 400


# ============================================================
# List Documents
# ============================================================


def test_list_documents_empty(client, auth_headers):
    response = client.get("/documents", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    assert data["documents"] == []
    assert data["total"] == 0
    assert data["page"] == 1


def test_list_documents_requires_auth(client):
    response = client.get("/documents")
    assert response.status_code == 401


def test_list_documents_returns_only_own(client, auth_headers, auth_headers2):
    # User 1 uploads a document
    with patch("app.tasks.extraction_tasks.extract_text_task.delay"):
        client.post(
            "/documents/upload",
            files=make_txt_upload("user1doc.txt"),
            headers=auth_headers,
        )

    # User 2 should see empty list
    response = client.get("/documents", headers=auth_headers2)
    assert response.status_code == 200
    assert response.json()["total"] == 0


def test_list_documents_pagination(client, auth_headers):
    with patch("app.tasks.extraction_tasks.extract_text_task.delay"):
        for i in range(3):
            client.post(
                "/documents/upload",
                files=make_txt_upload(f"doc{i}.txt"),
                headers=auth_headers,
            )

    response = client.get("/documents?page=1&limit=2", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    assert len(data["documents"]) == 2
    assert data["total"] == 3
    assert data["page"] == 1
    assert data["limit"] == 2


# ============================================================
# Get by ID
# ============================================================


def test_get_document_by_id_success(client, auth_headers, uploaded_document):
    doc_id = uploaded_document["id"]
    response = client.get(f"/documents/{doc_id}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["id"] == doc_id


def test_get_document_by_id_requires_auth(client, auth_headers, uploaded_document):
    doc_id = uploaded_document["id"]
    response = client.get(f"/documents/{doc_id}")
    assert response.status_code == 401


def test_get_document_by_id_not_found(client, auth_headers):
    response = client.get("/documents/99999", headers=auth_headers)
    assert response.status_code == 404


def test_get_document_by_id_cross_user_isolation(
    client, auth_headers, auth_headers2, uploaded_document
):
    """User 2 cannot access User 1's document — returns 404, not 403."""
    doc_id = uploaded_document["id"]
    response = client.get(f"/documents/{doc_id}", headers=auth_headers2)
    assert response.status_code == 404


# ============================================================
# Delete
# ============================================================


def test_delete_document_success(client, auth_headers, uploaded_document):
    doc_id = uploaded_document["id"]
    response = client.delete(f"/documents/{doc_id}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["message"] == "Document Deleted Successfully"

    # Confirm it's gone
    get_response = client.get(f"/documents/{doc_id}", headers=auth_headers)
    assert get_response.status_code == 404


def test_delete_document_requires_auth(client, uploaded_document):
    doc_id = uploaded_document["id"]
    response = client.delete(f"/documents/{doc_id}")
    assert response.status_code == 401


def test_delete_document_not_found(client, auth_headers):
    response = client.delete("/documents/99999", headers=auth_headers)
    assert response.status_code == 404


def test_delete_document_cross_user_isolation(
    client, auth_headers, auth_headers2, uploaded_document
):
    """User 2 cannot delete User 1's document."""
    doc_id = uploaded_document["id"]
    response = client.delete(f"/documents/{doc_id}", headers=auth_headers2)
    assert response.status_code == 404


# ============================================================
# Download
# ============================================================


def test_download_document_success(client, auth_headers, uploaded_document):
    doc_id = uploaded_document["id"]
    response = client.get(f"/documents/{doc_id}/download", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.content) > 0


def test_download_document_requires_auth(client, uploaded_document):
    doc_id = uploaded_document["id"]
    response = client.get(f"/documents/{doc_id}/download")
    assert response.status_code == 401


def test_download_document_not_found(client, auth_headers):
    response = client.get("/documents/99999/download", headers=auth_headers)
    assert response.status_code == 404


def test_download_document_cross_user_isolation(
    client, auth_headers, auth_headers2, uploaded_document
):
    """User 2 cannot download User 1's document."""
    doc_id = uploaded_document["id"]
    response = client.get(f"/documents/{doc_id}/download", headers=auth_headers2)
    assert response.status_code == 404


# ============================================================
# Text Endpoint
# ============================================================


def test_get_document_text_not_yet_extracted(client, auth_headers, uploaded_document):
    """Immediately after upload, text hasn't been extracted yet → 404."""
    doc_id = uploaded_document["id"]
    response = client.get(f"/documents/{doc_id}/text", headers=auth_headers)
    # Either 404 (not extracted) or 202 (processing)
    assert response.status_code in (404, 202)


def test_get_document_text_requires_auth(client, uploaded_document):
    doc_id = uploaded_document["id"]
    response = client.get(f"/documents/{doc_id}/text")
    assert response.status_code == 401


def test_get_document_text_cross_user_isolation(
    client, auth_headers, auth_headers2, uploaded_document
):
    doc_id = uploaded_document["id"]
    response = client.get(f"/documents/{doc_id}/text", headers=auth_headers2)
    assert response.status_code == 404
