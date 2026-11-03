"""Cac hang so dung chung. Khong de so co dinh rai rac trong ma nguon."""

# Tai khoan
MIN_PASSWORD_LENGTH = 6
MAX_PASSWORD_LENGTH = 50
MAX_PASSWORD_BYTES = 72  # gioi han cua bcrypt
MSG_BAD_CREDENTIALS = "Email hoặc mật khẩu không đúng"

# Quy tac muon sach (BR01, BR04) - dung o cac task sau
MAX_ACTIVE_LOANS = 3
ALLOWED_LOAN_DAYS = (7, 14, 30)

# Tien phat (BR06) - dung o cac task sau
FINE_PER_DAY = 5000

# Dat truoc (RSV-02) - dung o cac task sau
RESERVATION_HOLD_HOURS = 48
