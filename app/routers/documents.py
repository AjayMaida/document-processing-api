from fastapi import (
    APIRouter,
    Depends,
    File,
    Query,
    UploadFile,
)
from fastapi import (
    Path as PathParam,
)
from fastapi.responses import StreamingResponse

from app.dependencies import get_current_user, get_document_service
from app.models.user import User
from app.schemas.document import DocumentListResponse, DocumentResponse
from app.services.document_service import DocumentService

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


@router.get(
    "/search",
    summary="Search documents",
    description="Search for documents by filename.",
    response_model=DocumentListResponse,
)
def search_documents(
    q: str = Query(..., description="Search keyword"),
    service: DocumentService = Depends(get_document_service),
    user: User = Depends(get_current_user),
):
    documents = service.search_documents(q, user.id)
    return {
        "documents": documents,
        "page": 1,
        "limit": len(documents),
        "total": len(documents),
    }


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


@router.get("/{document_id}/status")
def get_document_status(
    document_id: int = PathParam(..., ge=1),
    service: DocumentService = Depends(get_document_service),
    user: User = Depends(get_current_user),
):
    """
    Get the current processing status of a document.
    """
    return service.get_document_status(
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

    # Use the storage abstraction to download the file
    file_stream = service.storage.download(document.stored_filename)

    return StreamingResponse(
        file_stream,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={document.original_filename}"
        },
    )


@router.get("/{document_id}/text")
def get_extracted_text(
    document_id: int = PathParam(..., ge=1),
    service: DocumentService = Depends(get_document_service),
    user: User = Depends(get_current_user),
):
    """
    Retrieve the extracted text for a document as a stream.
    """
    document = service.get_extracted_text(document_id=document_id, user_id=user.id)

    # The laziest way to get the stream from the linked extracted_text record
    text_path = document.extracted_text.text_path
    text_stream = service.storage.download(text_path)

    return StreamingResponse(
        text_stream,
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename=extracted_{document.id}.txt"
        },
    )
