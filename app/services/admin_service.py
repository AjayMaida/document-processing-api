from fastapi import HTTPException

from app.core.storage.base import StorageInterface
from app.models.document import Document
from app.models.user import User
from app.repositories.document_repository import DocumentRepository
from app.repositories.user_repository import UserRepository


class AdminService:
    def __init__(
        self,
        user_repository: UserRepository,
        document_repository: DocumentRepository,
        storage: StorageInterface,
    ):
        self.user_repository = user_repository
        self.document_repository = document_repository
        self.storage = storage

    def list_users(
        self,
        page: int,
        limit: int,
    ) -> dict:
        offset = (page - 1) * limit

        users = self.user_repository.list_users(
            offset=offset,
            limit=limit,
        )
        total_users = self.user_repository.count_users()

        return {
            "users": users,
            "page": page,
            "limit": limit,
            "total": total_users,
        }

    def list_documents(
        self,
        page: int,
        limit: int,
    ) -> dict:
        offset = (page - 1) * limit

        documents = self.document_repository.list_all_documents(
            offset=offset,
            limit=limit,
        )
        total = self.document_repository.count_all_documents()

        return {
            "documents": documents,
            "page": page,
            "limit": limit,
            "total": total,
        }

    def download_document(
        self,
        document_id: int,
    ) -> Document:
        document = self.document_repository.get_document_by_id_for_admin(
            document_id
        )

        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")

        if not self.storage.exists(document.stored_filename):
            raise HTTPException(
                status_code=404,
                detail="Document file not found",
            )

        return document

    def get_extracted_text(
        self,
        document_id: int,
    ) -> Document:
        document = self.document_repository.get_document_by_id_for_admin(
            document_id
        )

        if document is None:
            raise HTTPException(status_code=404, detail="Document not found")

        if document.extracted_text is None:
            raise HTTPException(
                status_code=404,
                detail="No extracted text found for this document",
            )

        if document.extracted_text.status != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Extraction is not complete. Current status: {document.extracted_text.status}",
            )

        if not document.extracted_text.text_path:
            raise HTTPException(
                status_code=500,
                detail="Extraction completed but no text path was saved",
            )

        return document

    def update_user_role(self, user_id: int, role: str) -> User:
        if role not in ["user", "admin"]:
            raise HTTPException(status_code=400, detail="Invalid role specified")

        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        self.user_repository.update_role(user_id, role)
        
        # Refresh user object to reflect change
        return self.user_repository.get_by_id(user_id)
