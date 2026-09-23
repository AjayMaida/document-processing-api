from abc import ABC, abstractmethod
from typing import BinaryIO


class StorageInterface(ABC):
    """
    Abstract Base Class for storage providers.
    Ensures that any storage implementation (Local, S3, Azure)
    follows the same contract.
    """

    @abstractmethod
    def upload(self, file_data: BinaryIO, destination_path: str) -> str:
        """Upload a file and return the stored path/key."""

    @abstractmethod
    def download(self, source_path: str) -> BinaryIO:
        """Retrieve a file as a binary stream."""

    @abstractmethod
    def delete(self, source_path: str) -> None:
        """Remove a file from storage."""
