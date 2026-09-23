from app.dependencies import get_current_user
from app.main import app
from app.models.document import Document
from app.models.user import User


def test_download_non_existent_file(client, db_session):
    """
    Scenario: DB record exists, but file is missing from storage.
    Expectation: 404 Not Found.
    """
    user = User(username="chaos", email="chaos@test.com", hashed_password="pw")
    db_session.add(user)
    db_session.commit()
    app.dependency_overrides[get_current_user] = lambda: user

    doc = Document(
        original_filename="ghost.pdf",
        stored_filename="ghost_stored.pdf",
        user_id=user.id,
    )
    db_session.add(doc)
    db_session.commit()

    # We explicitly do NOT upload the file to storage.

    response = client.get(f"/documents/{doc.id}/download")
    assert response.status_code == 404
    assert response.json()["detail"] == "Document file not found"

    app.dependency_overrides.pop(get_current_user, None)


def test_unauthorized_document_access(client, db_session):
    """
    Scenario: User A tries to access User B's document.
    Expectation: 404 Not Found (for security, we don't confirm existence).
    """
    user_a = User(username="user_a", email="a@test.com", hashed_password="pw")
    user_b = User(username="user_b", email="b@test.com", hashed_password="pw")
    db_session.add_all([user_a, user_b])
    db_session.commit()

    doc_b = Document(
        original_filename="secret.pdf",
        stored_filename="secret_stored.pdf",
        user_id=user_b.id,
    )
    db_session.add(doc_b)
    db_session.commit()

    # User A is logged in
    app.dependency_overrides[get_current_user] = lambda: user_a

    response = client.get(f"/documents/{doc_b.id}")
    assert response.status_code == 404

    app.dependency_overrides.pop(get_current_user, None)


def test_invalid_document_id(client, db_session):
    """
    Scenario: Requesting a document with an ID that doesn't exist.
    Expectation: 404 Not Found.
    """
    user = User(username="test", email="t@t.com", hashed_password="pw")
    db_session.add(user)
    db_session.commit()
    app.dependency_overrides[get_current_user] = lambda: user

    response = client.get("/documents/999999")
    assert response.status_code == 404

    app.dependency_overrides.pop(get_current_user, None)
