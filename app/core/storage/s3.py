import io
from typing import BinaryIO, ClassVar

from app.core.storage.base import StorageInterface


class S3Storage(StorageInterface):
    """
    Mock implementation of S3 Storage.
    Simulates a cloud object store using a class-level shared dictionary.
    """

    # We use a class variable so that different instances of S3Storage
    # (e.g., one in the API and one in the test) share the same simulated bucket.
    _shared_bucket: ClassVar[dict[str, bytes]] = {}

    def __init__(self):
        pass

    def upload(self, file_data: BinaryIO, destination_path: str) -> str:
        # Read the binary stream and store it in our shared bucket
        content = file_data.read()
        S3Storage._shared_bucket[destination_path] = content
        return destination_path

    def download(self, source_path: str) -> BinaryIO:
        if source_path not in S3Storage._shared_bucket:
            raise FileNotFoundError(f"S3 Object {source_path} not found.")

        # Return as a binary stream
        return io.BytesIO(S3Storage._shared_bucket[source_path])

    def delete(self, source_path: str) -> None:
        if source_path in S3Storage._shared_bucket:
            del S3Storage._shared_bucket[source_path]

    def exists(self, source_path: str) -> bool:
        return source_path in S3Storage._shared_bucket
