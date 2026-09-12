import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.celery_app import celery_app
from app.core.config import settings
from app.db.base import Base
from app.dependencies import get_db
from app.main import app
from app.models.document import Document
from app.models.user import User


@pytest.fixture(autouse=True)
def configure_celery_test_mode():
    celery_app.conf.update(
        task_always_eager=True,
        task_eager_propagates=True,
    )


@pytest.fixture(autouse=True)
def override_task_session(monkeypatch):
    monkeypatch.setattr("app.tasks.extraction_tasks.SessionLocal", TestingSessionLocal)


from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.pool import StaticPool

TEST_DATABASE_URL = settings.test_database_url

try:
    engine = create_engine(TEST_DATABASE_URL)
    with engine.connect() as conn:
        pass
except SQLAlchemyError:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

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


@pytest.fixture
def document(db_session):
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="hashed-password",
    )

    db_session.add(user)
    db_session.flush()

    document = Document(
        original_filename="test.pdf",
        stored_filename="stored-test.pdf",
        status="uploaded",
        user_id=user.id,
    )

    db_session.add(document)
    db_session.flush()

    return document
