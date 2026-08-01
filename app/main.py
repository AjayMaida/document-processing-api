
from fastapi import FastAPI,UploadFile, File, Depends,Query,Path
from app.schemas.request_models import LoginRequest
from app.schemas.response_models import LoginResponse, DocumentResponse, DocumentListResponse
from app.dependencies import get_document_service
from app.services.document_service import DocumentService



app = FastAPI(
    title="Document Processing API",
    description="A production-ready backend for document upload and processing.",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "Welcome to the Document Processing API!"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

@app.get("/users/{id}")
def get_user(id: int):
    return {
        "user_id": id,
    }

@app.get("/users")
def get_users(
    page: int = 1,
    limit: int = 10
):
    return{
        "page": page,
        "limit": limit
    }


@app.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    return {
        "message": "Login Successful!",
        # "username": request.username,
        # "password": request.password
    }


@app.post("/documents/upload",response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    service: DocumentService = Depends(get_document_service),
):
    document = await service.upload_document(file)

    return document


@app.get("/documents",response_model=DocumentListResponse)
def get_documents(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10,ge=1,le=10),
    service: DocumentService = Depends(get_document_service),
):
    return service.get_documents(page,limit)

@app.get("/documents/{document_id}",response_model=DocumentResponse)
def get_document_by_id(
    document_id: int = Path(...,ge=1),
    service: DocumentService = Depends(get_document_service),
):
    return service.get_document_by_id(document_id)