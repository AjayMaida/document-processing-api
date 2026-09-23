# 🚀 Pull Request: Stateless Storage Abstraction, Async Processing, Advanced Endpoints & CI/CD Pipeline

---

## 📌 1. Executive Summary

### What Problem Are We Solving?
Prior to this PR, the backend had several architectural bottlenecks and missing production requirements:
1. **Tight Coupling to Local Disk**: File reads and writes were hardcoded to the local container filesystem, preventing horizontal scaling across multiple instances or running in serverless/cloud environments (e.g., AWS S3).
2. **Missing Consumer Endpoints**: Although text extraction was performed in the background, there were no API endpoints for clients to monitor extraction progress (`/status`), stream extracted text (`/text`), or search across processed documents.
3. **Storage Leaks on Deletion**: Deleting a document removed the database record and original upload, but left the generated extracted text files orphaned in storage.
4. **Lack of File Size Guardrails**: Large files could be uploaded without payload limits, creating denial-of-service and disk exhaustion risks.
5. **No Automated CI/CD**: There was no continuous integration pipeline to guarantee code formatting, linting standards, and test suite execution on pull requests.

### What Does This PR Do?
This PR turns the Document Processing API into a **production-ready, horizontally scalable, storage-agnostic platform**:
- 🌐 **Pluggable Storage Abstraction**: Introduces an abstract `StorageInterface` with `LocalStorage` and in-memory cloud mock `S3Storage`. File operations in API routers, background workers, and services now use storage streams rather than local filesystem paths.
- ⚡ **Distributed Asynchronous Task Queue**: Celery workers backed by Redis handle all CPU-intensive PDF, DOCX, and TXT parsing off the main HTTP event loop.
- 🔍 **Search & Content Retrieval**: Adds `GET /documents/search?q=...` supporting both filename matching and full-text matching inside extracted text files. Adds `GET /documents/{id}/status` and streaming `GET /documents/{id}/text`.
- 🛡️ **Defensive Engineering & Leak Prevention**: Enforces a configurable 20MB file upload limit (`HTTP 413 Payload Too Large`) and ensures atomic deletion of both original uploads and extracted artifacts from storage.
- 👤 **Identity Profile Endpoints**: Adds `GET /auth/me` and `GET /users/me` returning current user metadata.
- 📊 **Structured Logging Middleware**: Measures and logs request latency and status codes for API observability.
- ⚙️ **GitHub Actions CI/CD**: Configured `.github/workflows/ci.yml` running linting (`ruff`), formatting checks, and automated tests (`pytest`) against PostgreSQL 16 and Redis 7 test containers.
- 🧪 **Comprehensive Test Coverage**: Expanded test suite to **45 tests** across unit, lifecycle integration, and chaos scenarios.

---

## 🏛️ 2. High-Level Architecture Diagram

```mermaid
flowchart TD
    Client["🌐 Client: Web, Mobile, CLI"]

    subgraph API_Layer ["Presentation & API Layer - FastAPI"]
        RouterAuth["app/routers/auth.py<br/>/auth/register, /login, /refresh, /me"]
        RouterDoc["app/routers/documents.py<br/>/documents, /upload, /search, /status, /text, /download"]
        LogMiddleware["app/core/logging.py<br/>LoggingMiddleware"]
    end

    subgraph Service_Layer ["Business Logic & Services"]
        AuthSvc["AuthService"]
        DocSvc["DocumentService"]
        ExtractSvc["TextExtractionService"]
    end

    subgraph Storage_Layer ["Pluggable Storage Layer - StorageInterface"]
        LocalStorage["LocalStorage<br/>Local Disk: /uploads and /extracted"]
        S3Storage["S3Storage<br/>Simulated Cloud Object Store"]
    end

    subgraph Async_Queue ["Distributed Task Queue"]
        Redis[("⚡ Redis Message Broker - Port 6379")]
        CeleryWorker["👷 Celery Worker Process<br/>tasks.extract_document_text"]
    end

    subgraph Persistence ["Relational Database"]
        Postgres[("🐘 PostgreSQL 16")]
    end

    Client -->|"HTTP and JWT"| LogMiddleware
    LogMiddleware --> RouterAuth
    LogMiddleware --> RouterDoc

    RouterAuth --> AuthSvc
    RouterDoc --> DocSvc

    AuthSvc --> Postgres
    DocSvc --> Postgres
    DocSvc --> Storage_Layer

    DocSvc -->|"1. Enqueue Task ~2ms"| Redis
    Redis -->|"2. Pull Task"| CeleryWorker
    CeleryWorker --> ExtractSvc
    ExtractSvc --> Postgres
    ExtractSvc --> Storage_Layer
```

---

## 🔄 3. End-to-End Sequence Diagrams

### A. Document Upload & Async Processing Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as FastAPI Router
    participant DocSvc as DocumentService
    participant Storage as StorageInterface
    participant DB as PostgreSQL
    participant Redis as Redis Broker
    participant Worker as Celery Worker
    participant ExtSvc as TextExtractionService

    Client->>API: POST /documents/upload (File + JWT)
    API->>DocSvc: upload_document(file, current_user)
    Note over DocSvc: Validate file extension, MIME type, size <= 20MB
    DocSvc->>Storage: upload(file_stream, stored_filename)
    DocSvc->>DB: INSERT INTO documents (status="uploaded")
    DB-->>DocSvc: Document(id=101)
    DocSvc->>Redis: extract_document_text.delay(doc_id=101, user_id=1)
    Redis-->>DocSvc: Task UUID Enqueued
    DocSvc-->>API: DocumentResponse
    API-->>Client: 200 OK (Document metadata) [Instant Response]

    Note over Redis, Worker: Asynchronous Background Processing
    Redis-)Worker: Task: tasks.extract_document_text(101, 1)
    Worker->>DB: Open SessionLocal()
    Worker->>ExtSvc: extract_text(document)
    ExtSvc->>Storage: download(stored_filename)
    Storage-->>ExtSvc: Binary stream
    Note over ExtSvc: Parse text from PyMuPDF, python-docx, or txt
    ExtSvc->>Storage: upload(text_stream, "extracted/101/extracted.txt")
    ExtSvc->>DB: UPDATE extracted_texts SET status="completed"
    Worker->>DB: Close session
```

---

### B. Extracted Text Retrieval & Content Search Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as FastAPI Router
    participant DocSvc as DocumentService
    participant Repo as DocumentRepository
    participant Storage as StorageInterface
    participant DB as PostgreSQL

    alt Get Extracted Text Stream
        Client->>API: GET /documents/101/text (JWT)
        API->>DocSvc: get_extracted_text(doc_id=101, user_id=1)
        DocSvc->>DB: SELECT * FROM documents WHERE id=101 AND user_id=1
        DocSvc->>Storage: download("extracted/101/extracted.txt")
        Storage-->>API: Binary stream (text/plain)
        API-->>Client: 200 OK (StreamingResponse: extracted_101.txt)
    else Search by Keyword (Filename + Content)
        Client->>API: GET /documents/search?q=quarterly (JWT)
        API->>DocSvc: search_documents(query="quarterly", user_id=1)
        DocSvc->>Repo: search_documents(query, user_id) [SQL ILIKE]
        DocSvc->>Repo: get_documents_with_extracted_text(user_id)
        loop For each document with completed extraction
            DocSvc->>Storage: download(text_path)
            Note over DocSvc: Check if query in text content
        end
        DocSvc-->>API: Combined matched documents list
        API-->>Client: 200 OK (DocumentListResponse)
    end
```

---

## 📋 4. Key Endpoints Added & Updated

| Method | Endpoint | Auth | Description | Status Code |
| :--- | :--- | :---: | :--- | :---: |
| `GET` | `/auth/me` | Bearer | Retrieve current user profile (`id`, `username`, `email`, `created_at`) | `200 OK` |
| `GET` | `/users/me` | Bearer | User profile alias adhering to API specification | `200 OK` |
| `GET` | `/documents/search` | Bearer | Search documents by filename (`ILIKE`) and extracted text content | `200 OK` |
| `GET` | `/documents/{id}/status` | Bearer | Inspect document status and extraction progress (`pending`, `processing`, `completed`) | `200 OK` |
| `GET` | `/documents/{id}/text` | Bearer | Stream processed plain text directly from the storage provider | `200 OK` |
| `GET` | `/documents/{id}/download`| Bearer | Stream original uploaded file via `StorageInterface` | `200 OK` |
| `POST`| `/documents/upload` | Bearer | Upload document with 20MB validation (`HTTP 413` on oversize) | `200 OK` / `413` |
| `DELETE`| `/documents/{id}` | Bearer | Cascade delete DB records and purge both file and extracted text from storage | `200 OK` |

---

## 🛠️ 5. Changed Files Breakdown

```text
.github/
└── workflows/
    └── ci.yml                             # [NEW] GitHub Actions CI workflow (PostgreSQL + Redis + pytest + ruff)
app/
├── core/
│   ├── config.py                          # [MOD] Added max_file_size_bytes configuration
│   ├── logging.py                         # [MOD] Implemented LoggingMiddleware (latency & status logging)
│   └── storage/                           # [NEW] Storage abstraction package
│       ├── base.py                        # [NEW] StorageInterface ABC
│       ├── local.py                       # [NEW] LocalStorage filesystem provider
│       └── s3.py                          # [NEW] S3Storage in-memory mock provider
├── dependencies.py                        # [MOD] Added get_storage() dependency injection
├── main.py                                # [MOD] Attached LoggingMiddleware, added user_router
├── repositories/
│   └── document_repository.py             # [MOD] Added search_documents & get_documents_with_extracted_text
├── routers/
│   ├── auth.py                            # [MOD] Added /auth/me and /users/me endpoints
│   └── documents.py                       # [MOD] Added /search, /status, /text, storage streaming
├── schemas/
│   └── auth.py                            # [MOD] Added UserResponse schema
├── services/
│   ├── document_service.py                # [MOD] Enforce 20MB limit, storage cleanup on delete, content search
│   └── text_extraction_service.py         # [MOD] Converted to use StorageInterface and binary streams
└── tasks/
    └── extraction_tasks.py                # [MOD] Celery task updated to instantiate storage provider
tests/
├── conftest.py                            # [MOD] Added authenticated_user fixture
├── test_auth.py                           # [MOD] Added test coverage for /auth/me and /users/me
├── test_documents.py                      # [MOD] Unit tests for LocalStorage provider
├── test_documents_chaos.py                # [NEW] Edge case tests (storage 404s, cross-tenant isolation)
├── test_documents_integration.py          # [NEW] End-to-end lifecycle & search integration tests
├── test_extraction_tasks.py               # [MOD] Updated task test for storage paths
└── test_text_extraction_service.py        # [MOD] Complete update for stream extraction & storage
```

---

## 🧪 6. Testing & Quality Verification

### Test Suite Execution
All **45 tests** across unit, integration, and chaos suites pass without error:
```bash
uv run pytest
```
```text
tests/test_auth.py ......................                                [ 48%]
tests/test_documents.py ..                                               [ 53%]
tests/test_documents_chaos.py ...                                        [ 60%]
tests/test_documents_integration.py .....                                [ 71%]
tests/test_extracted_text_repository.py .....                            [ 82%]
tests/test_extraction_tasks.py ..                                        [ 86%]
tests/test_text_extraction_service.py ......                             [100%]

============================== 45 passed in 4.17s ==============================
```

### Static Analysis & Linting
```bash
uv run ruff check .
uv run ruff format --check .
```
```text
All checks passed!
60 files already formatted
```

---

## 🚢 7. Deployment & Migration Notes

- **Environment Variables**:
  - `MAX_FILE_SIZE_BYTES` (Optional): Overrides the default 20MB limit.
  - `STORAGE_PROVIDER` (Optional): `"local"` (default) or `"s3"`.
- **Database Migrations**: No schema alterations required; existing Alembic revisions cover all models.
- **Docker Compose**: Ready for deployment via `docker compose up --build`.
