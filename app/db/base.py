from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all ORM models so they are registered with Base.metadata
from app.models import Document, ExtractedText, RefreshToken, User  # noqa: E402, F401

__all__ = ["Base", "Document", "ExtractedText", "RefreshToken", "User"]
