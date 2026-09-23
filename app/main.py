from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.logging import LoggingMiddleware
from app.routers import documents
from app.routers.auth import router as auth_router
from app.routers.auth import user_router

app = FastAPI(
    title="Document Processing API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)


@app.get("/")
def root():
    return {"message": "Welcome to the Document Processing API!"}


@app.get("/health")
def health():
    return {"status": "healthy"}


app.include_router(documents.router)
app.include_router(auth_router)
app.include_router(user_router)
