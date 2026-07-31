from app.models.document import Document
from app.repositories.document_repository import DocumentRepository
import uuid
from pathlib import Path
import shutil
from fastapi import HTTPException,UploadFile
from app.core.config import settings

class DocumentService:
    def __init__(self, repository: DocumentRepository):
        self.repository = repository



    def _validate_file(self,file:UploadFile)-> None:
        if file.content_type not in settings.ALLOWED_CONTENT_TYPE:
            raise HTTPException(status_code=400, detail="Invalid file type")

        if not Path(file.filename).suffix.lower() in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid file extension")
        

    def _generate_filename(self,filename:str)->str:
        extention = Path(filename).suffix
        return f"{uuid.uuid4()}{extention}"

    async def upload_document(
            self,
            file:UploadFile,

    ) -> Document:
        self._validate_file(file)
        stored_filename = self._generate_filename(file.filename)
        destination = Path(settings.upload_dir)/stored_filename


        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)



        document = Document(
        original_filename=file.filename,
        stored_filename=stored_filename,
        status="uploaded",
        )

        try:
            return self.repository.create(document)
        except Exception:
            if destination.exists():
                destination.unlink()

            raise
        
