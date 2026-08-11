from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories.search_repository import SearchRepository
from app.schemas.search import SearchResponse, SearchResult


class SearchService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = SearchRepository(db)

    def search(
        self,
        query: str,
        user_id: int,
        page: int,
        limit: int,
    ) -> SearchResponse:
        if not query or not query.strip():
            raise HTTPException(
                status_code=400,
                detail="Search query cannot be empty.",
            )

        query = query.strip()
        offset = (page - 1) * limit

        rows = self.repository.search(query, user_id, offset, limit)
        total = self.repository.count(query, user_id)

        results = []
        for document, extracted in rows:
            # Build a snippet from extracted content if available
            snippet = ""
            if extracted and extracted.content:
                snippet = self._build_snippet(extracted.content, query)

            results.append(
                SearchResult(
                    document_id=document.id,
                    original_filename=document.original_filename,
                    snippet=snippet,
                    word_count=extracted.word_count if extracted else 0,
                    status=document.status,
                    created_at=document.created_at,
                )
            )

        return SearchResponse(
            query=query,
            results=results,
            total=total,
            page=page,
            limit=limit,
        )

    def _build_snippet(self, content: str, query: str, context_chars: int = 200) -> str:
        """
        Extract a snippet from content around the first occurrence of the query term.
        Falls back to the first `context_chars` characters if no match found.
        """
        lower_content = content.lower()
        lower_query = query.lower()
        idx = lower_content.find(lower_query)

        if idx == -1:
            return content[:context_chars] + ("..." if len(content) > context_chars else "")

        start = max(0, idx - context_chars // 2)
        end = min(len(content), idx + len(query) + context_chars // 2)
        snippet = content[start:end]

        if start > 0:
            snippet = "..." + snippet
        if end < len(content):
            snippet = snippet + "..."

        return snippet
