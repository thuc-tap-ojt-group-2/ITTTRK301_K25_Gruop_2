from typing import List
from app.database import get_db
from app.models import User
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session

# Cấu hình JWT (phải khớp với SECRET_KEY và ALGORITHM lúc sinh token ở login)
SECRET_KEY = "SECRET_KEY_FOR_JWT_AUTHENTICATION_OJT"
ALGORITHM = "HS256"

# Đường dẫn Swagger dùng để lấy token đăng nhập
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# AUTH-03: Dependency giải mã JWT và lấy user hiện tại
def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
  credentials_exception = HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Token xác thực không hợp lệ hoặc đã hết hạn",
      headers={"WWW-Authenticate": "Bearer"},
  )
  try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    # Hỗ trợ lấy user_id hoặc sub từ payload token
    user_id = payload.get("user_id")
    username = payload.get("sub")

    if user_id is not None:
      current_user = db.query(User).filter(User.id == user_id).first()
    elif username is not None:
      current_user = db.query(User).filter(User.username == username).first()
    else:
      raise credentials_exception

  except jwt.PyJWTError:
    raise credentials_exception

  if current_user is None:
    raise credentials_exception

  return current_user


# AUTH-05: Class dependency kiểm tra quyền (Role-Based Access Control)
class RoleChecker:

  def __init__(self, allowed_roles: List[str]):
    self.allowed_roles = allowed_roles

  def __call__(self, current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in self.allowed_roles:
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Bạn không có quyền thực hiện hành động này",
      )
    return current_user