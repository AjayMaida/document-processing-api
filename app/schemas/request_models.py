from pydantic import BaseModel,Field

class LoginRequest(BaseModel):
    username: str = Field(
        description = "User Login Name",
        min_length = 3,
        max_length = 20
    )
    password: str = Field(
        description = "User Login Password",
        min_length = 3,
        max_length = 20
    )