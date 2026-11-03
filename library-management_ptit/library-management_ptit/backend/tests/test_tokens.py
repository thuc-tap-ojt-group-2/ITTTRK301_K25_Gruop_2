import unittest
from datetime import datetime, timedelta, timezone

import jwt

from app.tokens import TokenService

SECRET = "test-secret-test-secret-test-secret-123"


class TokenServiceTest(unittest.TestCase):
    def test_create_then_decode_returns_same_data(self):
        service = TokenService(SECRET, 24)
        token = service.create(7, "a@ptit.edu.vn", "READER")
        claims = service.decode(token)
        self.assertEqual("7", claims["sub"])
        self.assertEqual("a@ptit.edu.vn", claims["email"])
        self.assertEqual("READER", claims["role"])

    def test_token_expires_after_configured_hours(self):
        service = TokenService(SECRET, 24)
        claims = service.decode(service.create(1, "a@ptit.edu.vn", "ADMIN"))
        lifetime = datetime.fromtimestamp(claims["exp"], timezone.utc) - datetime.fromtimestamp(claims["iat"], timezone.utc)
        self.assertEqual(timedelta(hours=24), lifetime)

    def test_expired_token_is_rejected(self):
        service = TokenService(SECRET, -1)
        token = service.create(1, "a@ptit.edu.vn", "READER")
        with self.assertRaises(jwt.ExpiredSignatureError):
            service.decode(token)

    def test_token_signed_with_other_secret_is_rejected(self):
        token = TokenService("another-secret-another-secret-12345", 24).create(1, "a@ptit.edu.vn", "READER")
        with self.assertRaises(jwt.InvalidSignatureError):
            TokenService(SECRET, 24).decode(token)

    def test_tampered_token_is_rejected(self):
        service = TokenService(SECRET, 24)
        token = service.create(1, "a@ptit.edu.vn", "READER")
        with self.assertRaises(jwt.InvalidTokenError):
            service.decode(token[:-3] + "abc")


if __name__ == "__main__":
    unittest.main()
