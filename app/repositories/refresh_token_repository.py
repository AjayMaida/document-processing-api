from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken
from sqlalchemy import select




class RefreshTokenRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, refresh_token: RefreshToken) -> RefreshToken|None:
        self.db.add(refresh_token)
        self.db.flush()
        self.db.refresh(refresh_token)
        return refresh_token

    def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        stmt = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash
        )
        return self.db.scalar(stmt)