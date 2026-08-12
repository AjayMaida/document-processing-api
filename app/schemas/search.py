from datetime import datetime

from pydantic import BaseModel


class SearchResult(BaseModel):
    document_id: int
    original_filename: str
    snippet: str
    word_count: int
    status: str
    created_at: datetime


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    total: int
    page: int
    limit: int
