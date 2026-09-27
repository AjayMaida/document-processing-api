from app.dependencies import get_current_user
from app.main import app
from app.models.user import User


def test_list_users_rejects_normal_user(client, db_session):
    user = User(
        username="regular-user",
        email="user@example.com",
        hashed_password="hashed-password",
        role="user",
    )
    db_session.add(user)
    db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = client.get("/admin/users")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient permissions"


def test_list_users_allows_admin(client, db_session):
    admin = User(
        username="admin-user",
        email="admin@example.com",
        hashed_password="hashed-password",
        role="admin",
    )
    regular_user = User(
        username="regular-user",
        email="user@example.com",
        hashed_password="hashed-password",
        role="user",
    )
    db_session.add_all([admin, regular_user])
    db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: admin

    try:
        response = client.get("/admin/users")
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200

    payload = response.json()
    assert payload["page"] == 1
    assert payload["limit"] == 10
    assert payload["total"] == 2

    usernames = {user["username"] for user in payload["users"]}
    assert usernames == {"admin-user", "regular-user"}

    roles = {user["role"] for user in payload["users"]}
    assert roles == {"admin", "user"}
