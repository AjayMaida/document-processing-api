# 📄 Document Processing API

A production-ready backend service built with **FastAPI** that allows users to upload documents, extract text asynchronously, search content, and manage their documents securely through a REST API.

![CI](https://github.com/AjayMaida/document-processing-api/actions/workflows/ci.yml/badge.svg?branch=feature/complete-project)

---

## ✨ Features

- 🔐 **JWT Authentication** with refresh token rotation
- 📤 **Document upload** (PDF, DOCX, TXT) with validation
- 🔍 **Full-text search** across filenames and extracted content
- 📝 **Async text extraction** via Celery + Redis (background processing)
- 👤 **User ownership** — users only see and manage their own documents
- 📄 **RESTful API** with automatic OpenAPI (Swagger) docs
- 🐳 **Docker** + docker-compose for local and production deployment
- ✅ **Full test suite** (auth + documents + search) with isolated test DB
- 🚦 **CI/CD** via GitHub Actions (lint → test → docker build)

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Language | Python 3.12+ |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.x |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| Authentication | JWT (PyJWT) + bcrypt |
| Task Queue | Celery + Redis |
| Text Extraction | pdfplumber, python-docx |
| Validation | Pydantic v2 |
| Testing | Pytest + httpx |
| Code Quality | Ruff, Pre-commit |
| Containerization | Docker + docker-compose |
| CI/CD | GitHub Actions |

---

## 📂 Project Structure

```text
document-processing-api/
├── app/
│   ├── main.py                  ← FastAPI app entrypoint
│   ├── celery_app.py            ← Celery configuration
│   ├── dependencies.py          ← DI factories (JWT guard, services)
│   ├── core/
│   │   ├── config.py            ← pydantic-settings config
│   │   └── security.py          ← JWT + bcrypt + refresh token utils
│   ├── db/                      ← SQLAlchemy engine + session
│   ├── models/                  ← ORM models (User, Document, RefreshToken, ExtractedText)
│   ├── repositories/            ← Data access layer (per-model)
│   ├── routers/                 ← Route handlers (auth, documents, search)
│   ├── schemas/                 ← Pydantic request/response schemas
│   ├── services/                ← Business logic layer
│   └── tasks/                   ← Celery async tasks
├── tests/
│   ├── conftest.py              ← Fixtures (client, auth headers, uploaded docs)
│   ├── test_auth.py             ← 18 auth tests
│   ├── test_documents.py        ← 28 document endpoint tests
│   └── test_search.py           ← 8 search tests
├── alembic/                     ← DB migrations
├── requirements/
│   ├── base.txt                 ← Runtime deps
│   ├── dev.txt                  ← Dev + lint deps
│   └── test.txt                 ← Test deps
├── Dockerfile                   ← Multi-stage build
├── docker-compose.yml           ← api + celery + postgres + redis
└── .github/workflows/ci.yml    ← GitHub Actions CI
```

---

## 🚀 Getting Started

### Option A — Docker (recommended)

```bash
cp .env.example .env
# Fill in JWT_SECRET_KEY in .env

make docker-up         # Start all services (API + Celery + Postgres + Redis)
make docker-down       # Stop all services
```

API available at: `http://localhost:8000`

### Option B — Local Development

```bash
# Clone and setup
git clone https://github.com/AjayMaida/document-processing-api.git
cd document-processing-api
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1
# Linux/macOS
source .venv/bin/activate

pip install -r requirements/dev.txt

cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET_KEY, etc.

# Run migrations
make migrate

# Start API (in terminal 1)
make run

# Start Celery worker (in terminal 2 — requires Redis running)
make worker
```

---

## 📖 API Documentation

Once running:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | ❌ | Register a new user |
| POST | `/auth/login` | ❌ | Login → access + refresh tokens |
| POST | `/auth/refresh` | ❌ | Rotate refresh token |
| GET | `/documents` | ✅ | List your documents (paginated) |
| POST | `/documents/upload` | ✅ | Upload a document |
| GET | `/documents/{id}` | ✅ | Get document details |
| DELETE | `/documents/{id}` | ✅ | Delete a document |
| GET | `/documents/{id}/download` | ✅ | Download file |
| GET | `/documents/{id}/text` | ✅ | Get extracted text |
| GET | `/search?q=...` | ✅ | Full-text search |

---

## 🧪 Running Tests

```bash
# Run all tests
make test

# Run with Docker test DB
make docker-test
```

---

## 📈 Roadmap

- ✅ Project planning & architecture design
- ✅ FastAPI project setup with clean layered architecture
- ✅ Database integration (PostgreSQL + SQLAlchemy + Alembic)
- ✅ Document CRUD (upload, list, get, delete, download)
- ✅ JWT Authentication + refresh token rotation
- ✅ User ownership — all document endpoints scoped to user
- ✅ Async text extraction (PDF/DOCX/TXT via Celery + Redis)
- ✅ Full-text search (filename + extracted content)
- ✅ Complete test suite (54 tests across auth, documents, search)
- ✅ Docker + docker-compose deployment
- ✅ GitHub Actions CI/CD (lint → test → docker build)

---

## 📄 License

This project is licensed under the MIT License.