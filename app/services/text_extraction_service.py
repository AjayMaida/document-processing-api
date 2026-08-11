from pathlib import Path

import pdfplumber
from docx import Document as DocxDocument


class TextExtractionService:
    """
    Responsible for extracting raw text from uploaded documents.
    Supports PDF, DOCX, and plain TXT files.
    """

    def extract(self, file_path: Path, content_type: str) -> dict:
        """
        Extract text from a file on disk.

        Returns a dict with:
          - content: str  (full extracted text)
          - page_count: int
          - word_count: int
        """
        suffix = file_path.suffix.lower()

        if suffix == ".pdf":
            return self._extract_pdf(file_path)
        elif suffix == ".docx":
            return self._extract_docx(file_path)
        elif suffix == ".txt":
            return self._extract_txt(file_path)
        else:
            return {"content": "", "page_count": 0, "word_count": 0}

    def _extract_pdf(self, file_path: Path) -> dict:
        pages_text = []
        with pdfplumber.open(file_path) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)

        content = "\n".join(pages_text)
        word_count = len(content.split()) if content else 0

        return {
            "content": content,
            "page_count": page_count,
            "word_count": word_count,
        }

    def _extract_docx(self, file_path: Path) -> dict:
        doc = DocxDocument(str(file_path))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        content = "\n".join(paragraphs)
        word_count = len(content.split()) if content else 0

        return {
            "content": content,
            "page_count": 1,  # DOCX has no reliable page count without rendering
            "word_count": word_count,
        }

    def _extract_txt(self, file_path: Path) -> dict:
        content = file_path.read_text(encoding="utf-8", errors="replace")
        word_count = len(content.split()) if content else 0

        return {
            "content": content,
            "page_count": 1,
            "word_count": word_count,
        }
