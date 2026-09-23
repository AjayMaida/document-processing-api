import shutil
from pathlib import Path
from typing import BinaryIO

from app.core.config import settings
from app.core.storage.base import StorageInterface


class LocalStorage(StorageInterface):
    """
    Local Filesystem implementation of StorageInterface.
    Used for development and simple deployments.
    """

    def __init__(self):
        # We use the directory from settings to know where to save
        self.base_path = Path(settings.upload_dir)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def upload(self, file_data: BinaryIO, destination_path: str) -> str:
        # destination_path is the relative path (e.g., "uuid.pdf" or "extracted/1/extracted.txt")
        full_path = self.base_path / destination_path

        # Ensure parent directories exist (fixes FileNotFoundError for subfolders)
        full_path.parent.mkdir(parents=True, exist_ok=True)

        with full_path.open("wb") as buffer:
            shutil.copyfileobj(file_data, buffer)

        return destination_path

    def download(self, source_path: str) -> BinaryIO:
        full_path = self.base_path / source_path
        if not full_path.exists():
            raise FileNotFoundError(f"File {source_path} not found in local storage")

        return full_path.open("rb")

    def delete(self, source_path: str) -> None:
        full_path = self.base_path / source_path
        if full_path.exists():
            full_path.unlink()

    def exists(self, source_path: str) -> bool:
        return (self.base_path / source_path).exists()
