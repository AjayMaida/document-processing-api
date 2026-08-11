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

    second_payload = {
        **payload,
        "email": "second@example.com",
    }

    response = client.post("/auth/register", json=second_payload)

    assert response.status_code == 409
    assert response.json()["detail"] == "Username already exists"
def test_register_duplicate_email(client):
    payload = {
        "username": "firstuser",
        "email": "duplicate@example.com",
        "password": "TestPassword123",
        "confirm_password": "TestPassword123",
    }

    first_response = client.post("/auth/register", json=payload)
    assert first_response.status_code == 200

    second_payload = {
        **payload,
        "username": "seconduser",
    }

    response = client.post("/auth/register", json=second_payload)

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already exists"
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
