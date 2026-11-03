from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.passwords import PasswordHasher
from app.repositories.user_repository import UserRepository
from app.schemas import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.services.auth_service import AuthService
from app.tokens import TokenService

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(
        UserRepository(db),
        PasswordHasher(),
        TokenService(settings.jwt_secret, settings.jwt_expire_hours),
    )


@router.post("/register", response_model=UserResponse, status_code=201)
def register(body: RegisterRequest, service: AuthService = Depends(get_auth_service)):
    user = service.register(body.full_name, body.student_code, body.email, body.password)
    return UserResponse.from_data(user)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return AuthResponse(**service.login(body.email, body.password))
