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


class ExtractedTextResponse(BaseModel):
    document_id: int
    content: str
    page_count: int
    word_count: int
    extracted_at: datetime

    model_config = ConfigDict(from_attributes=True)
