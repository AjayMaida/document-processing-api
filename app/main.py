from fastapi import FastAPI

from app.routers import documents
from app.routers.auth import router as auth_router

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Welcome to the Document Processing API!"}


@app.get("/health")
def health():
    return {"status": "healthy"}


app.include_router(documents.router)
app.include_router(auth_router)
