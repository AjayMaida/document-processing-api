from fastapi import APIRouter, Query, UploadFile, File, Depends, Path as PathParam
from app.schemas.document import DocumentResponse, DocumentListResponse, ExtractedTextResponse
from pathlib import Path
from app.core.config import settings
from fastapi.responses import FileResponse
from app.dependencies import get_document_service, get_current_user
from app.services.document_service import DocumentService
from app.models.user import User


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


@router.get(
    "",
    summary="List all documents",
    description="Returns paginated documents.",
    response_model=DocumentListResponse,
)
def get_documents(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=10),
    service: DocumentService = Depends(get_document_service),
    user: User = Depends(get_current_user),
):
    return service.get_documents(
        page,
        limit,
        user.id,
    )


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    service: DocumentService = Depends(get_document_service),
    user: User = Depends(get_current_user),
):

    return await service.upload_document(
        file,
        current_user=user,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document_by_id(
    document_id: int = PathParam(..., ge=1),
    service: DocumentService = Depends(get_document_service),
    user: User = Depends(get_current_user),
):
    return service.get_document_by_id(
        document_id=document_id,
        user_id=user.id,
    )


@router.delete("/{document_id}")
def delete_document(
    document_id: int = PathParam(..., ge=1),
    service: DocumentService = Depends(get_document_service),
    user: User = Depends(get_current_user),
):
    service.delete_document(document_id=document_id, user_id=user.id)

    return {"message": "Document Deleted Successfully"}


@router.get("/{document_id}/download")
def download_document(
    document_id: int = PathParam(..., ge=1),
    service: DocumentService = Depends(get_document_service),
    user: User = Depends(get_current_user),
):
    document = service.download_document(document_id=document_id, user_id=user.id)
    file_path = Path(settings.upload_dir) / document.stored_filename
    return FileResponse(
        path=file_path,
        filename=document.original_filename,
    )


@router.get("/{document_id}/text", response_model=ExtractedTextResponse)
def get_document_text(
    document_id: int = PathParam(..., ge=1),
    service: DocumentService = Depends(get_document_service),
    user: User = Depends(get_current_user),
):
    return service.get_document_text(document_id=document_id, user_id=user.id)
