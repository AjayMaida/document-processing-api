from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all ORM models so they are registered with Base.metadata
from app.models.document import Document  # noqa: E402, F401
from app.models.extracted_text import ExtractedText  # noqa: E402, F401
from app.models.refresh_token import RefreshToken  # noqa: E402, F401
from app.models.user import User  # noqa: E402, F401

__all__ = ["Base", "Document", "ExtractedText", "RefreshToken", "User"]

