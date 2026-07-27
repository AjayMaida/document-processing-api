# Database Design Document

**Project Name:** Document Processing API

**Version:** 1.0

**Status:** Draft

**Author:** Ajay Maida

**Last Updated:** July 2026

---

# 1. Purpose

This document defines the logical database design for the Document Processing API.

The goal is to create a normalized, scalable, and maintainable database schema that supports user management, document processing, metadata storage, and future AI-powered capabilities.

---

# 2. Database Technology

| Property | Value |
|----------|-------|
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Migration Tool | Alembic |
| Primary Key | UUID |
| Timestamp | UTC |

---

# 3. Entity Relationship Diagram

```text
+---------+
|  Users  |
+---------+
     |
     | 1
     |
     | N
+-------------+
| Documents   |
+-------------+
     |
     | 1
     |
     | 1
+----------------+
| ExtractedText  |
+----------------+
```

---

# 4. Database Tables

## 4.1 Users

Stores registered users.

| Column | Type | Constraints |
|---------|------|-------------|
| id | UUID | Primary Key |
| full_name | VARCHAR(100) | Not Null |
| email | VARCHAR(255) | Unique |
| password_hash | TEXT | Not Null |
| is_active | BOOLEAN | Default TRUE |
| created_at | TIMESTAMP | Default NOW() |
| updated_at | TIMESTAMP | Auto Updated |

---

## 4.2 Documents

Stores uploaded document metadata.

| Column | Type | Constraints |
|---------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | Foreign Key → Users |
| original_filename | VARCHAR(255) | Not Null |
| stored_filename | VARCHAR(255) | Unique |
| file_extension | VARCHAR(10) | Not Null |
| file_size | BIGINT | Not Null |
| storage_path | TEXT | Not Null |
| upload_status | VARCHAR(30) | Default Uploaded |
| created_at | TIMESTAMP | Default NOW() |
| updated_at | TIMESTAMP | Auto Updated |

---

## 4.3 ExtractedText

Stores processed document data.

| Column | Type | Constraints |
|---------|------|-------------|
| id | UUID | Primary Key |
| document_id | UUID | Foreign Key → Documents |
| extracted_text | TEXT | Not Null |
| page_count | INTEGER | Default 0 |
| word_count | INTEGER | Default 0 |
| character_count | INTEGER | Default 0 |
| processing_time_ms | INTEGER | Nullable |
| processed_at | TIMESTAMP | Default NOW() |

---

# 5. Relationships

## Users → Documents

Relationship

```
One User

↓

Many Documents
```

Foreign Key

```
documents.user_id → users.id
```

---

## Documents → ExtractedText

Relationship

```
One Document

↓

One ExtractedText
```

Foreign Key

```
extracted_text.document_id → documents.id
```

---

# 6. Database Constraints

## Users

- Email must be unique.
- Password hash cannot be NULL.

## Documents

- File size must be greater than zero.
- Stored filename must be unique.

## ExtractedText

- Every record must belong to a document.
- One extracted record per document.

---

# 7. Indexing Strategy

## Users

- email

## Documents

- user_id
- original_filename
- upload_status

## ExtractedText

- document_id

Future

- PostgreSQL Full Text Search Index

---

# 8. Cascade Rules

Deleting a User

↓

Delete all Documents

↓

Delete all ExtractedText

---

# 9. Normalization

The schema follows Third Normal Form (3NF).

Benefits

- No duplicated document data
- Easier maintenance
- Better query performance
- Improved scalability

---

# 10. Future Tables

## ProcessingJobs

Tracks background document processing.

| Column | Purpose |
|---------|----------|
| id | Job ID |
| document_id | Related document |
| status | Pending / Running / Completed |
| started_at | Processing start |
| completed_at | Processing finish |

---

## AuditLogs

Stores security events.

Examples

- User Login
- Upload
- Delete
- Failed Login

---

## RefreshTokens

Supports JWT refresh tokens.

---

## Tags

Categorize uploaded documents.

---

## DocumentEmbeddings

Stores vector embeddings for semantic search.

---

# 11. Storage Strategy

Version 1

```
Documents

↓

Local Storage

↓

Metadata → PostgreSQL
```

Version 2

```
Documents

↓

AWS S3

↓

Metadata → PostgreSQL
```

---

# 12. Naming Conventions

## Tables

- snake_case
- plural names

Examples

- users
- documents
- extracted_text

---

## Columns

- snake_case
- descriptive names

Examples

- created_at
- processing_time_ms
- password_hash

---

# 13. Design Decisions

- UUID primary keys for better scalability.
- Metadata separated from extracted content.
- Document processing isolated from upload logic.
- Schema designed for future AI extensions.
- Normalized structure to reduce redundancy.

---

# 14. Future Database Enhancements

- PostgreSQL Full-Text Search
- Redis Caching
- Partitioning for large datasets
- Read Replicas
- Multi-tenancy
- Vector Database Integration

---

# 15. Summary

The database schema provides a clean and extensible foundation for document management, authentication, processing, and future AI-powered capabilities while maintaining data integrity, scalability, and performance.