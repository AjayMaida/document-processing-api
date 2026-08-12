from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.db.seed import seed_admin_user
from app.db.session import SessionLocal
from app.routers import documents
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.search import router as search_router

app = FastAPI(
    title="Document Processing API",
    description="Upload, manage, and search documents with AI-powered text extraction.",
    version="1.0.0",
)


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_admin_user(db)
    finally:
        db.close()


# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files directory
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
def root():
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(
            index_file,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
    return {"message": "Welcome to the Document Processing API!"}


@app.get("/health")
def health():
    return {"status": "healthy"}


app.include_router(documents.router)
app.include_router(auth_router)
app.include_router(search_router)
app.include_router(admin_router)



