import bcrypt


class PasswordHasher:
    """Bam mat khau bang bcrypt (AUTH-04). Khong bao gio luu mat khau goc."""

    def hash(self, raw_password: str) -> str:
        return bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def verify(self, raw_password: str, password_hash: str) -> bool:
        try:
            return bcrypt.checkpw(raw_password.encode("utf-8"), password_hash.encode("utf-8"))
        except ValueError:
            return False
