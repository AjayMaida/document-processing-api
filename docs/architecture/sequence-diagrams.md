# Sequence Diagrams

**Project Name:** Document Processing API

**Version:** 1.0

**Status:** Draft

**Author:** Ajay Maida

**Last Updated:** July 2026

---

# Overview

This document describes the interaction flow between the client, API, services, database, and storage components using Mermaid sequence diagrams.

---

# 1. User Registration

```mermaid
sequenceDiagram
    actor User
    participant API as FastAPI
    participant Service as Auth Service
    participant DB as PostgreSQL

    User->>API: POST /auth/register
    API->>Service: Validate Request
    Service->>DB: Check Email
    DB-->>Service: Email Available
    Service->>Service: Hash Password
    Service->>DB: Create User
    DB-->>Service: User Created
    Service-->>API: Success
    API-->>User: 201 Created
```

---

# 2. User Login

```mermaid
sequenceDiagram
    actor User
    participant API as FastAPI
    participant Service as Auth Service
    participant DB as PostgreSQL

    User->>API: POST /auth/login
    API->>Service: Validate Credentials
    Service->>DB: Get User
    DB-->>Service: User Record
    Service->>Service: Verify Password
    Service->>Service: Generate JWT
    Service-->>API: Access Token
    API-->>User: 200 OK
```

---

# 3. Upload Document

```mermaid
sequenceDiagram
    actor User
    participant API as FastAPI
    participant Service as Document Service
    participant Storage as Local Storage
    participant DB as PostgreSQL

    User->>API: POST /documents/upload
    API->>Service: Validate JWT
    Service->>Service: Validate File
    Service->>Storage: Save File
    Storage-->>Service: File Saved
    Service->>DB: Store Metadata
    DB-->>Service: Success
    Service-->>API: Upload Complete
    API-->>User: 201 Created
```

---

# 4. Process Document

```mermaid
sequenceDiagram
    actor User
    participant API as FastAPI
    participant Service as Processing Service
    participant Storage as Local Storage
    participant DB as PostgreSQL

    User->>API: POST /documents/{id}/process
    API->>Service: Start Processing
    Service->>Storage: Read File
    Storage-->>Service: File Content
    Service->>Service: Extract Text
    Service->>Service: Calculate Statistics
    Service->>DB: Save Extracted Data
    DB-->>Service: Success
    Service-->>API: Processing Complete
    API-->>User: 200 OK
```

---

# 5. Retrieve Extracted Text

```mermaid
sequenceDiagram
    actor User
    participant API as FastAPI
    participant Service as Document Service
    participant DB as PostgreSQL

    User->>API: GET /documents/{id}/text
    API->>Service: Validate JWT
    Service->>DB: Fetch Extracted Text
    DB-->>Service: Text Data
    Service-->>API: Response
    API-->>User: 200 OK
```

---

# 6. Search Documents

```mermaid
sequenceDiagram
    actor User
    participant API as FastAPI
    participant Service as Search Service
    participant DB as PostgreSQL

    User->>API: GET /search?q=invoice
    API->>Service: Validate Request
    Service->>DB: Search Documents
    DB-->>Service: Matching Records
    Service-->>API: Search Results
    API-->>User: 200 OK
```

---

# 7. Delete Document

```mermaid
sequenceDiagram
    actor User
    participant API as FastAPI
    participant Service as Document Service
    participant Storage as Local Storage
    participant DB as PostgreSQL

    User->>API: DELETE /documents/{id}
    API->>Service: Validate JWT
    Service->>DB: Verify Ownership
    DB-->>Service: Authorized
    Service->>Storage: Delete File
    Storage-->>Service: File Deleted
    Service->>DB: Delete Metadata
    DB-->>Service: Success
    Service-->>API: Deleted
    API-->>User: 204 No Content
```

---

# Summary

The sequence diagrams describe the complete lifecycle of the application's core operations, including authentication, document upload, processing, retrieval, searching, and deletion. They serve as a reference for implementation, testing, and future enhancements.