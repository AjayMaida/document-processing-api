from datetime import datetime
from pydantic import BaseModel, ConfigDict

class LoginResponse(BaseModel):
    username: str
    message: str

class DocumentUploadResponse(BaseModel):
    id: int
    original_filename: str
    stored_filename: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)