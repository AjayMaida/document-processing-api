# 📄 Document Processing API

A production-ready backend service built with **FastAPI** that allows users to upload documents, extract text, store metadata, and retrieve processed information through secure REST APIs.

This project is designed to demonstrate modern backend engineering practices, including clean architecture, authentication, database design, Docker, and automated testing. It also serves as a foundation for future AI-powered document analysis features.

---

## ✨ Features

- User authentication with JWT
- Upload PDF, DOCX, and TXT files
- Extract text from documents
- Store document metadata in PostgreSQL
- Search uploaded documents
- RESTful API design
- Automatic OpenAPI (Swagger) documentation
- Docker support
- Unit and integration testing
- Clean Architecture

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Language | Python 3.12+ |
| Framework | FastAPI |
| ORM | SQLAlchemy |
| Database | PostgreSQL |
| Migrations | Alembic |
| Authentication | JWT |
| Validation | Pydantic |
| Testing | Pytest |
| Code Quality | Ruff, Pre-commit |
| Containerization | Docker |

---

## 📂 Project Structure

```text
document-processing-api/
├── app/
├── docs/
├── uploads/
├── requirements/
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
└── README.md
```

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone <repository-url>
cd document-processing-api
```

### Install and sync with uv

Install uv if it is not already available:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then create a Python 3.12 environment and install the project dependencies:

```bash
uv python install 3.12
uv sync
```

### Run the application

```bash
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

---

## 📖 API Documentation

Once the application is running:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 🏗️ Architecture

The project follows a layered architecture:

- API Layer
- Service Layer
- Repository Layer
- Database Layer

Detailed design documents are available in the `docs/` directory.

---

## 📈 Roadmap

- ✅ Project planning
- ✅ Architecture design
- ⏳ FastAPI project setup
- ⏳ Database integration
- ⏳ Authentication
- ⏳ Document upload
- ⏳ Text extraction
- ⏳ Search
- ⏳ Docker deployment
- ⏳ CI/CD

---

## 📄 License

This project is licensed under the MIT License.
