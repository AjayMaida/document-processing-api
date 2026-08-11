from passlib.context import CryptContext
from datetime import datetime,timezone,timedelta
import jwt
from app.core.config import settings
import secrets
import hashlib


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )

def create_jwt_token(user_id:int)->str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)

    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

def create_refresh_token() -> str:
    return secrets.token_urlsafe(64)
def hash_refresh_token(refresh_token:str)->str:
    return hashlib.sha256(refresh_token.encode()).hexdigest()
def verify_refresh_token(
    token: str,
    token_hash: str,
) -> bool:
    return hash_refresh_token(token) == token_hash

def decode_access_token(token: str) -> dict:
    try:
        payload=jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Access token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid access token")