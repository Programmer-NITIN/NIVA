"""
NIVA — Authentication & Role-Based Access Control (RBAC) Service.
Issues and validates HMAC-SHA256 JWT tokens for:
- 'customer' (Self-service borrower journey, vernacular copilot)
- 'bank_officer' (Risk underwriting console, restructuring, counseling)
"""

from datetime import datetime, timedelta
from typing import Optional, List
import jwt
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings

SECRET_KEY = getattr(settings, "secret_key", "niva-hackathon-secret-change-in-prod")
ALGORITHM = "HS256"
DEFAULT_EXPIRE_MINUTES = getattr(settings, "access_token_expire_minutes", 60 * 24)

security_scheme = HTTPBearer(auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT token containing subject, role, and claims."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=DEFAULT_EXPIRE_MINUTES))
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify signature + expiry of JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature.",
        )


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)) -> dict:
    """
    Extracts and validates current authenticated user from Bearer header.
    Returns decoded token dictionary or demo anonymous context if not provided.
    """
    if not credentials:
        # Graceful demo fallback for unauthenticated requests in development
        return {
            "sub": "demo_user",
            "role": "customer",
            "persona_id": "rajesh_sharma",
            "name": "Demo User",
            "is_authenticated": False,
        }

    payload = decode_access_token(credentials.credentials)
    payload["is_authenticated"] = True
    return payload


def require_roles(allowed_roles: List[str]):
    """
    FastAPI dependency factory enforcing Role-Based Access Control (RBAC).
    Example: Depends(require_roles(['bank_officer', 'admin']))
    """
    def role_checker(user: dict = Depends(get_current_user)):
        user_role = user.get("role", "customer")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}. Your role: {user_role}",
            )
        return user
    return role_checker
