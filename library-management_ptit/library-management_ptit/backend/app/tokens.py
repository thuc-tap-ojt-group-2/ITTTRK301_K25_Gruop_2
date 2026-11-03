from datetime import datetime, timedelta, timezone

import jwt


class TokenService:
    """Tao va doc JWT (NFR-02): chua id (sub), email, vai tro; het han sau jwt_expire_hours."""

    ALGORITHM = "HS256"

    def __init__(self, secret: str, expire_hours: int):
        self._secret = secret
        self._expire_hours = expire_hours

    def create(self, user_id: int, email: str, role: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user_id),
            "email": email,
            "role": role,
            "iat": now,
            "exp": now + timedelta(hours=self._expire_hours),
        }
        return jwt.encode(payload, self._secret, algorithm=self.ALGORITHM)

    def decode(self, token: str) -> dict:
        """Nem jwt.InvalidTokenError (hoac lop con) neu token sai hoac het han. Dung o task TH-03."""
        return jwt.decode(token, self._secret, algorithms=[self.ALGORITHM])
