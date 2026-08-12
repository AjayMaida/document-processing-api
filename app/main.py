from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import documents
from app.routers.auth import router as auth_router
from app.routers.search import router as search_router

app = FastAPI(
    title="Document Processing API",
    description="Upload, manage, and search documents with AI-powered text extraction.",
    version="1.0.0",
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Welcome to the Document Processing API!"}


@app.get("/health")
def health():
    return {"status": "healthy"}


app.include_router(documents.router)
app.include_router(auth_router)
app.include_router(search_router)

