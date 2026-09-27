from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    id: int
    original_filename: str
    stored_filename: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    page: int
    limit: int
    total: int


class DocumentOwnerResponse(BaseModel):
    id: int
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class AdminDocumentResponse(DocumentResponse):
    user_id: int
    user: DocumentOwnerResponse


class AdminDocumentListResponse(BaseModel):
    documents: list[AdminDocumentResponse]
    page: int
    limit: int
    total: int
