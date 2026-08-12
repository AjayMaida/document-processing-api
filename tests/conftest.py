import io
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.db.base import Base
from app.dependencies import get_db
from app.core.config import settings

TEST_DATABASE_URL = settings.test_database_url

engine = create_engine(TEST_DATABASE_URL)

TestingSessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def mock_celery_task():
    """Globally mock the Celery extraction task so tests never need Redis."""
    from unittest.mock import patch

    with patch("app.tasks.extraction_tasks.extract_text_task.delay"):
        yield

# ---------------------------------------------------------------------------
# Shared helper fixtures
# ---------------------------------------------------------------------------

USER_PAYLOAD = {
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "TestPassword123",
    "confirm_password": "TestPassword123",
}

USER2_PAYLOAD = {
    "username": "otheruser",
    "email": "otheruser@example.com",
    "password": "TestPassword123",
    "confirm_password": "TestPassword123",
}


@pytest.fixture
def registered_user(client):
    """Register and return user 1."""
    response = client.post("/auth/register", json=USER_PAYLOAD)
    assert response.status_code == 200
    return response.json()


@pytest.fixture
def registered_user2(client):
    """Register and return user 2 (for ownership isolation tests)."""
    response = client.post("/auth/register", json=USER2_PAYLOAD)
    assert response.status_code == 200
    return response.json()


@pytest.fixture
def auth_headers(client, registered_user):
    """Login as user 1 and return Bearer auth headers."""
    response = client.post(
        "/auth/login",
        json={
            "username": USER_PAYLOAD["username"],
            "password": USER_PAYLOAD["password"],
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers2(client, registered_user2):
    """Login as user 2 and return Bearer auth headers."""
    response = client.post(
        "/auth/login",
        json={
            "username": USER2_PAYLOAD["username"],
            "password": USER2_PAYLOAD["password"],
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def make_txt_upload(filename: str = "test.txt", content: str = "Hello world test content."):
    """Helper to build a multipart file upload payload."""
    return {
        "file": (filename, io.BytesIO(content.encode()), "text/plain"),
    }


@pytest.fixture
def uploaded_document(client, auth_headers):
    """Upload a test TXT document as user 1 and return the response JSON."""
    from unittest.mock import patch

    with patch("app.tasks.extraction_tasks.extract_text_task.delay"):
        response = client.post(
            "/documents/upload",
            files=make_txt_upload(),
            headers=auth_headers,
        )
    assert response.status_code == 200
    return response.json()
