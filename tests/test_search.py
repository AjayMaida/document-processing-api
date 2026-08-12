"""
Tests for the search endpoint:
  GET /search?q=&page=&limit=

Covers: basic search, empty query, no auth, cross-user isolation,
        pagination, and filename-based search.
"""

from unittest.mock import patch

from tests.conftest import make_txt_upload

# ============================================================
# Auth
# ============================================================


def test_search_requires_auth(client):
    response = client.get("/search?q=hello")
    assert response.status_code == 401


def test_search_empty_query_rejected(client, auth_headers):
    """Query with only whitespace should fail validation."""
    response = client.get("/search?q= ", headers=auth_headers)
    assert response.status_code in (400, 422)


# ============================================================
# Basic Search
# ============================================================


def test_search_no_results(client, auth_headers):
    response = client.get("/search?q=nonexistentterm12345", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    assert data["results"] == []
    assert data["total"] == 0
    assert data["query"] == "nonexistentterm12345"


def test_search_by_filename(client, auth_headers):
    with patch("app.tasks.extraction_tasks.extract_text_task.delay"):
        client.post(
            "/documents/upload",
            files=make_txt_upload("quarterly_report.txt"),
            headers=auth_headers,
        )

    response = client.get("/search?q=quarterly", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    assert data["total"] >= 1
    filenames = [r["original_filename"] for r in data["results"]]
    assert any("quarterly" in f for f in filenames)


def test_search_response_structure(client, auth_headers):
    response = client.get("/search?q=test", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()
    assert "query" in data
    assert "results" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data


# ============================================================
# Ownership Isolation
# ============================================================


def test_search_cross_user_isolation(client, auth_headers, auth_headers2):
    """User 2 should not find User 1's documents in search results."""
    with patch("app.tasks.extraction_tasks.extract_text_task.delay"):
        client.post(
            "/documents/upload",
            files=make_txt_upload("secret_report.txt"),
            headers=auth_headers,
        )

    # User 2 searches for the same term
    response = client.get("/search?q=secret_report", headers=auth_headers2)
    assert response.status_code == 200
    assert response.json()["total"] == 0


# ============================================================
# Pagination
# ============================================================


def test_search_pagination(client, auth_headers):
    with patch("app.tasks.extraction_tasks.extract_text_task.delay"):
        for i in range(5):
            client.post(
                "/documents/upload",
                files=make_txt_upload(f"paginate_doc_{i}.txt"),
                headers=auth_headers,
            )

    page1 = client.get("/search?q=paginate&page=1&limit=3", headers=auth_headers)
    assert page1.status_code == 200
    assert len(page1.json()["results"]) == 3
    assert page1.json()["total"] == 5

    page2 = client.get("/search?q=paginate&page=2&limit=3", headers=auth_headers)
    assert page2.status_code == 200
    assert len(page2.json()["results"]) == 2
