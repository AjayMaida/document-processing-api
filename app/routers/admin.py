from fastapi import APIRouter, Depends, Query
from fastapi import Path as PathParam
from fastapi.responses import StreamingResponse

from app.dependencies import get_admin_service, require_admin
from app.models.user import User
from app.schemas.auth import RoleUpdateRequest, UserListResponse, UserResponse
from app.schemas.document import AdminDocumentListResponse
from app.services.admin_service import AdminService

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get(
    "/users",
    response_model=UserListResponse,
    summary="List all users",
)
def list_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    service: AdminService = Depends(get_admin_service),
    _admin: User = Depends(require_admin),
):
    return service.list_users(
        page=page,
        limit=limit,
    )


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="Update user role",
)
def update_user_role(
    request: RoleUpdateRequest,
    user_id: int = PathParam(..., ge=1),
    service: AdminService = Depends(get_admin_service),
    _admin: User = Depends(require_admin),
):
    return service.update_user_role(user_id, request.role)


@router.get(
    "/documents",
    response_model=AdminDocumentListResponse,
    summary="List all documents",
)
def list_documents(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    service: AdminService = Depends(get_admin_service),
    _admin: User = Depends(require_admin),
):
    return service.list_documents(
        page=page,
        limit=limit,
    )


@router.get(
    "/documents/{document_id}/download",
    summary="Download any document as an admin",
)
def download_document_as_admin(
    document_id: int = PathParam(..., ge=1),
    service: AdminService = Depends(get_admin_service),
    _admin: User = Depends(require_admin),
):
    document = service.download_document(document_id)

    return StreamingResponse(
        service.storage.download(document.stored_filename),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": (
                f"attachment; filename={document.original_filename}"
            ),
        },
    )


@router.get(
    "/documents/{document_id}/text",
    summary="Retrieve extracted text as an admin",
)
def get_extracted_text_as_admin(
    document_id: int = PathParam(..., ge=1),
    service: AdminService = Depends(get_admin_service),
    _admin: User = Depends(require_admin),
):
    document = service.get_extracted_text(document_id)

    return StreamingResponse(
        service.storage.download(document.extracted_text.text_path),
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename=extracted_{document.id}.txt"
        },
    )
