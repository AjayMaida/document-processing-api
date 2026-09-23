import io

from app.core.storage.local import LocalStorage


def test_local_storage_upload_and_exists():
    # Arrange
    storage = LocalStorage()
    file_content = io.BytesIO(b"Hello World")
    filename = "test_file.txt"

    # Act
    stored_path = storage.upload(file_content, filename)

    # Assert
    assert stored_path == filename
    assert storage.exists(filename) is True


def test_local_storage_delete():
    # Arrange
    storage = LocalStorage()
    file_content = io.BytesIO(b"Delete Me")
    filename = "delete_test.txt"
    storage.upload(file_content, filename)

    # Act
    storage.delete(filename)

    # Assert
    assert storage.exists(filename) is False
