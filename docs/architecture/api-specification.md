# API Specification

**Project Name:** Document Processing API

**Version:** v1

**API Version:** /api/v1

**Status:** Draft

**Author:** Ajay Maida

**Last Updated:** July 2026

---

# 1. Overview

This document defines the REST API endpoints for the Document Processing API.

The API follows REST principles and uses JSON for request and response bodies.

Base URL

```
http://localhost:8000/api/v1
```

Production URL

```
https://api.example.com/api/v1
```

---

# 2. API Standards

## Protocol

- HTTPS (Production)
- HTTP (Local Development)

## Data Format

```
application/json
```

## Authentication

JWT Bearer Token

```
Authorization: Bearer <access_token>
```

## Character Encoding

```
UTF-8
```

---

# 3. HTTP Status Codes

| Code | Meaning |
|------|----------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 413 | Payload Too Large |
| 415 | Unsupported Media Type |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

# 4. Standard Success Response

```json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": {}
}
```

---

# 5. Standard Error Response

```json
{
    "success": false,
    "message": "Validation failed",
    "error_code": "VALIDATION_ERROR"
}
```

---

# 6. Authentication APIs

---

## Register User

### Endpoint

```
POST /auth/register
```

### Authentication

Not Required

### Request

```json
{
    "full_name": "Ajay Maida",
    "email": "ajay@example.com",
    "password": "StrongPassword123!"
}
```

### Success Response

```
201 Created
```

```json
{
    "success": true,
    "message": "User registered successfully"
}
```

---

## Login

### Endpoint

```
POST /auth/login
```

### Authentication

Not Required

### Request

```json
{
    "email": "ajay@example.com",
    "password": "StrongPassword123!"
}
```

### Success Response

```
200 OK
```

```json
{
    "access_token": "<JWT_TOKEN>",
    "token_type": "Bearer"
}
```

---

## Current User

### Endpoint

```
GET /users/me
```

### Authentication

Required

### Success Response

```json
{
    "id": "...",
    "full_name": "Ajay Maida",
    "email": "ajay@example.com"
}
```

---

# 7. Document APIs

---

## Upload Document

### Endpoint

```
POST /documents/upload
```

### Authentication

Required

### Request

```
multipart/form-data
```

Field

```
file
```

Supported Formats

- PDF
- DOCX
- TXT

Maximum File Size

```
20 MB
```

### Success Response

```
201 Created
```

```json
{
    "document_id": "...",
    "status": "uploaded"
}
```

---

## List Documents

### Endpoint

```
GET /documents
```

### Authentication

Required

### Query Parameters

| Name | Description |
|------|-------------|
| page | Page Number |
| size | Page Size |
| sort | Sort Field |

---

## Get Document

### Endpoint

```
GET /documents/{document_id}
```

---

## Delete Document

### Endpoint

```
DELETE /documents/{document_id}
```

### Success Response

```
204 No Content
```

---

# 8. Processing APIs

---

## Extract Text

### Endpoint

```
POST /documents/{document_id}/process
```

### Authentication

Required

### Success Response

```json
{
    "status": "completed",
    "pages": 12,
    "word_count": 2500
}
```

---

## Get Extracted Text

### Endpoint

```
GET /documents/{document_id}/text
```

### Authentication

Required

### Success Response

```json
{
    "document_id": "...",
    "text": "Extracted content..."
}
```

---

# 9. Search APIs

---

## Search Documents

### Endpoint

```
GET /search
```

### Authentication

Required

### Query Parameters

| Parameter | Description |
|------------|------------|
| q | Search Keyword |
| page | Page Number |
| size | Page Size |
| sort | Sort Order |

Example

```
GET /search?q=invoice&page=1&size=10
```

---

# 10. Pagination

Request

```
?page=1&size=20
```

Response

```json
{
    "page": 1,
    "size": 20,
    "total": 135,
    "items": []
}
```

---

# 11. Validation Rules

## User

| Field | Rule |
|---------|------|
| Full Name | Required |
| Email | Valid Email |
| Password | Minimum 8 Characters |

---

## Document

| Field | Rule |
|---------|------|
| File Type | PDF, DOCX, TXT |
| File Size | Maximum 20 MB |

---

# 12. Security

- JWT Authentication
- Password Hashing
- Input Validation
- File Validation
- SQL Injection Protection
- XSS Protection

Future

- Refresh Tokens
- Rate Limiting
- RBAC

---

# 13. API Versioning

Current Version

```
/api/v1
```

Future

```
/api/v2
```

---

# 14. Future APIs

```
POST /documents/{id}/summarize

POST /documents/{id}/keywords

POST /documents/{id}/entities

POST /documents/{id}/embedding

POST /documents/chat
```

---

# 15. Endpoint Summary

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /auth/register | Register User |
| POST | /auth/login | Login User |
| GET | /users/me | Current User |
| POST | /documents/upload | Upload Document |
| GET | /documents | List Documents |
| GET | /documents/{id} | Document Details |
| DELETE | /documents/{id} | Delete Document |
| POST | /documents/{id}/process | Process Document |
| GET | /documents/{id}/text | Extracted Text |
| GET | /search | Search Documents |

---

# 16. Future Improvements

- OpenAPI Examples
- Request IDs
- API Rate Limiting
- API Analytics
- API Gateway Integration
- Webhooks
- Async Processing