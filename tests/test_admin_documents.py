from app.dependencies import get_current_user
from app.main import app
from app.models.document import Document
from app.models.user import User


def test_list_documents_rejects_normal_user(client, db_session):
    user = User(
        username="regular-user",
        email="user@example.com",
        hashed_password="hashed-password",
        role="user",
    )
    db_session.add(user)
    db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = client.get("/admin/documents")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient permissions"


def test_list_documents_allows_admin_and_includes_owners(client, db_session):
    admin = User(
        username="admin-user",
        email="admin@example.com",
        hashed_password="hashed-password",
        role="admin",
    )
    first_owner = User(
        username="first-owner",
        email="first@example.com",
        hashed_password="hashed-password",
        role="user",
    )
    second_owner = User(
        username="second-owner",
        email="second@example.com",
        hashed_password="hashed-password",
        role="user",
    )
    db_session.add_all([admin, first_owner, second_owner])
    db_session.commit()

    first_document = Document(
        original_filename="first.pdf",
        stored_filename="first-stored.pdf",
        status="completed",
        user_id=first_owner.id,
    )
    second_document = Document(
        original_filename="second.pdf",
        stored_filename="second-stored.pdf",
        status="uploaded",
        user_id=second_owner.id,
    )
    db_session.add_all([first_document, second_document])
    db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: admin

    try:
        response = client.get("/admin/documents")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200

    payload = response.json()
    assert payload["page"] == 1
    assert payload["limit"] == 10
    assert payload["total"] == 2

    documents = {
        document["original_filename"]: document for document in payload["documents"]
    }

    assert documents["first.pdf"]["user"]["username"] == "first-owner"
    assert documents["first.pdf"]["user"]["email"] == "first@example.com"
    assert documents["second.pdf"]["user"]["username"] == "second-owner"
    assert documents["second.pdf"]["user"]["email"] == "second@example.com"
