from datetime import UTC, datetime, timedelta

from app.core.security import hash_refresh_token
from app.models.refresh_token import RefreshToken

# ============================================================
# Registration
# ============================================================


def test_register_user(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "TestPassword123",
            "confirm_password": "TestPassword123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] is not None
    assert data["username"] == "testuser"
    assert data["email"] == "testuser@example.com"


def test_register_duplicate_username(client):
    payload = {
        "username": "duplicateuser",
        "email": "first@example.com",
        "password": "TestPassword123",
        "confirm_password": "TestPassword123",
    }

    first_response = client.post("/auth/register", json=payload)

    assert first_response.status_code == 200

    second_response = client.post(
        "/auth/register",
        json={
            **payload,
            "email": "second@example.com",
        },
    )

    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "Username already exists"


def test_register_duplicate_email(client):
    payload = {
        "username": "firstuser",
        "email": "duplicate@example.com",
        "password": "TestPassword123",
        "confirm_password": "TestPassword123",
    }

    first_response = client.post("/auth/register", json=payload)

    assert first_response.status_code == 200

    second_response = client.post(
        "/auth/register",
        json={
            **payload,
            "username": "seconduser",
        },
    )

    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "Email already exists"


def test_register_password_mismatch(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "mismatchuser",
            "email": "mismatch@example.com",
            "password": "TestPassword123",
            "confirm_password": "DifferentPassword123",
        },
    )

    assert response.status_code == 422


def test_register_username_too_short(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "ab",
            "email": "short@example.com",
            "password": "TestPassword123",
            "confirm_password": "TestPassword123",
        },
    )

    assert response.status_code == 422


def test_register_password_too_short(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "shortpassword",
            "email": "shortpassword@example.com",
            "password": "123",
            "confirm_password": "123",
        },
    )

    assert response.status_code == 422


def test_register_invalid_email(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "invalidemail",
            "email": "not-an-email",
            "password": "TestPassword123",
            "confirm_password": "TestPassword123",
        },
    )

    assert response.status_code == 422


# ============================================================
# Login
# ============================================================


def register_test_user(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "loginuser",
            "email": "loginuser@example.com",
            "password": "TestPassword123",
            "confirm_password": "TestPassword123",
        },
    )

    assert response.status_code == 200


def test_login_success(client):
    register_test_user(client)

    response = client.post(
        "/auth/login",
        json={
            "username": "loginuser",
            "password": "TestPassword123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["access_token"]
    assert data["refresh_token"]
    assert data["token_type"] == "bearer"


def test_login_wrong_username(client):
    register_test_user(client)

    response = client.post(
        "/auth/login",
        json={
            "username": "doesnotexist",
            "password": "TestPassword123",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


def test_login_wrong_password(client):
    register_test_user(client)

    response = client.post(
        "/auth/login",
        json={
            "username": "loginuser",
            "password": "WrongPassword123",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


# ============================================================
# Refresh Token
# ============================================================


def get_login_tokens(client):
    register_test_user(client)

    response = client.post(
        "/auth/login",
        json={
            "username": "loginuser",
            "password": "TestPassword123",
        },
    )

    assert response.status_code == 200

    return response.json()


def test_refresh_token_success(client):
    tokens = get_login_tokens(client)

    response = client.post(
        "/auth/refresh",
        json={
            "refresh_token": tokens["refresh_token"],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["access_token"]
    assert data["refresh_token"]
    assert data["token_type"] == "bearer"

    # Rotation means a new refresh token is returned.
    assert data["refresh_token"] != tokens["refresh_token"]


def test_old_refresh_token_rejected_after_rotation(client):
    tokens = get_login_tokens(client)

    first_refresh = client.post(
        "/auth/refresh",
        json={
            "refresh_token": tokens["refresh_token"],
        },
    )

    assert first_refresh.status_code == 200

    # Old refresh token should now be revoked.
    second_refresh = client.post(
        "/auth/refresh",
        json={
            "refresh_token": tokens["refresh_token"],
        },
    )

    assert second_refresh.status_code == 401
    assert second_refresh.json()["detail"] == "Refresh token has been revoked"


def test_invalid_refresh_token(client):
    response = client.post(
        "/auth/refresh",
        json={
            "refresh_token": "this-is-not-a-valid-refresh-token",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token"


# ============================================================
# Refresh Token Expiration / Revocation
# ============================================================


def test_expired_refresh_token(client, db_session):
    register_test_user(client)

    from app.repositories.user_repository import UserRepository

    user_repository = UserRepository(db_session)
    user = user_repository.get_by_username("loginuser")

    raw_token = "expired-refresh-token"

    token = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(raw_token),
        expires_at=datetime.now(UTC) - timedelta(days=1),
    )

    db_session.add(token)
    db_session.commit()

    response = client.post(
        "/auth/refresh",
        json={
            "refresh_token": raw_token,
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Refresh token has expired"


def test_revoked_refresh_token(client, db_session):
    register_test_user(client)

    from app.repositories.user_repository import UserRepository

    user_repository = UserRepository(db_session)
    user = user_repository.get_by_username("loginuser")

    raw_token = "revoked-refresh-token"

    token = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(raw_token),
        expires_at=datetime.now(UTC) + timedelta(days=1),
        revoked_at=datetime.now(UTC),
    )

    db_session.add(token)
    db_session.commit()

    response = client.post(
        "/auth/refresh",
        json={
            "refresh_token": raw_token,
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Refresh token has been revoked"


# ============================================================
# Access Token
# ============================================================


def test_authenticated_endpoint_with_valid_access_token(client):
    register_test_user(client)

    login_response = client.post(
        "/auth/login",
        json={
            "username": "loginuser",
            "password": "TestPassword123",
        },
    )

    assert login_response.status_code == 200

    access_token = login_response.json()["access_token"]

    response = client.get(
        "/documents",
        headers={
            "Authorization": f"Bearer {access_token}",
        },
    )

    assert response.status_code != 401


def test_authenticated_endpoint_without_token(client):
    response = client.get("/documents")

    assert response.status_code == 401


def test_authenticated_endpoint_with_invalid_token(client):
    response = client.get(
        "/documents",
        headers={
            "Authorization": "Bearer invalid-token",
        },
    )

    assert response.status_code == 401


def test_authenticated_endpoint_with_expired_token(client):
    import jwt

    from app.core.config import settings

    expired_token = jwt.encode(
        {
            "sub": "1",
            "type": "access",
            "iat": datetime.now(UTC) - timedelta(hours=2),
            "exp": datetime.now(UTC) - timedelta(hours=1),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    response = client.get(
        "/documents",
        headers={
            "Authorization": f"Bearer {expired_token}",
        },
    )

    assert response.status_code == 401


def test_authenticated_endpoint_with_refresh_token_as_bearer(client):
    import jwt

    from app.core.config import settings

    token = jwt.encode(
        {
            "sub": "1",
            "type": "refresh",
            "iat": datetime.now(UTC),
            "exp": datetime.now(UTC) + timedelta(hours=1),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    response = client.get(
        "/documents",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 401
