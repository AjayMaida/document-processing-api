import pytest
from fastapi import HTTPException, status

from app.dependencies import require_admin
from app.models.user import User


def test_require_admin_allows_admin():
    admin = User(
        username="admin",
        email="admin@example.com",
        hashed_password="hashed-password",
        role="admin",
    )

    assert require_admin(admin) is admin


def test_require_admin_rejects_normal_user():
    user = User(
        username="regular-user",
        email="user@example.com",
        hashed_password="hashed-password",
        role="user",
    )

    with pytest.raises(HTTPException) as exc_info:
        require_admin(user)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert exc_info.value.detail == "Insufficient permissions"