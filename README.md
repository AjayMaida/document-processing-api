# Document Processing API

A production-ready FastAPI application for managing documents and performing asynchronous text extraction. This project demonstrates a scalable architecture designed for high reliability and storage flexibility.

## 🚀 Features

- **Document Management**: Secure upload, retrieval, and deletion of documents.
- **Async Text Extraction**: Background extraction of text from PDF, DOCX, and TXT files using Celery and Redis.
- **Storage Agnostic Architecture**: A decoupled storage layer that supports both Local Filesystem and Cloud Storage (S3 Mock implemented).
- **Full-Text Search**: Fast keyword search across uploaded document filenames.
- **Real-time Status Tracking**: API endpoints to monitor the progress of background extraction tasks.

## 🛠 Architecture

The system follows a clean, layered architecture to ensure maintainability and testability:

- **API Layer (FastAPI)**: Handles HTTP requests, authentication, and response formatting.
- **Service Layer**: Contains the core business logic (e.g., coordinating extraction and storage).
- **Repository Layer**: Abstracts all database interactions using SQLAlchemy.
- **Storage Layer**: An abstract interface (`StorageInterface`) that separates the application from the physical storage medium.
- **Task Queue (Celery + Redis)**: Handles CPU-intensive text extraction asynchronously to keep the API responsive.

### Storage Flow
`Client` $\rightarrow$ `DocumentService` $\rightarrow$ `StorageInterface` $\rightarrow$ `[LocalStorage | S3Storage]`

## 📦 Installation & Setup

### Prerequisites
- Docker & Docker Compose
- Python 3.12+ (for local development)
- `uv` package manager

### Running with Docker (Recommended)
```bash
docker compose up --build
```
The API will be available at `http://localhost:8000`.

### Local Development
1. Install dependencies:
   ```bash
   uv sync
   ```
2. Start the API:
   ```bash
   uv run uvicorn app.main:app --reload
   ```
3. Start the Celery worker:
   ```bash
   uv run celery -A app.core.celery_app worker --loglevel=info
   ```

## 📖 API Specification

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/auth/register` | `POST` | Create a new account |
| `/auth/login` | `POST` | Authenticate and get JWT |
| `/documents/upload` | `POST` | Upload a document (PDF, DOCX, TXT) |
| `/documents` | `GET` | List all documents (paginated) |
| `/documents/search` | `GET` | Search documents by filename |
| `/documents/{id}` | `GET` | Get document metadata |
| `/documents/{id}/status` | `GET` | Check extraction progress |
| `/documents/{id}/download` | `GET` | Download original file |
| `/documents/{id}/text` | `GET` | Download extracted text |
| `/documents/{id}` | `DELETE` | Remove document and associated files |

## 🧪 Testing

The project uses `pytest` for both unit and integration testing.

```bash
# Run all tests
uv run pytest

# Run only integration tests
uv run pytest tests/test_documents_integration.py
```

## 🛡 Design Decisions

- **Storage Abstraction**: By using a `StorageInterface`, we can switch from local storage to S3 without changing a single line of business logic. This is critical for scaling.
- **Asynchronous Processing**: Text extraction is a heavy operation. Moving it to Celery ensures that the API remains responsive and prevents request timeouts.
- **Dependency Injection**: Using FastAPI's `Depends` allows us to swap out real services for mocks during testing, enabling a fast and reliable test suite.
