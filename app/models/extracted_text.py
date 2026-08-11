from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.document import Document


class ExtractedText(Base):
    __tablename__ = "extracted_texts"

    id: Mapped[int] = mapped_column(primary_key=True)

    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        nullable=False,
        unique=True,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )

    page_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    word_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    extracted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    document: Mapped["Document"] = relationship(
        back_populates="extracted_text",
    )
