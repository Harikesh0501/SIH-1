import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import bcrypt
from jose import jwt, JWTError
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

# Secret key & token parameters
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "RAKSHAK_AAYUSH_DEFENSE_SOVEREIGN_KEY_2026_MHA_SECURE")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security_bearer = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hashes a plain password using bcrypt with standard salt rounds."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a cryptographically signed JWT token carrying user claims:
    user_id, username, role, full_name, rank, company, service_number.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and cryptographically validates the JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired military session token. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )

# -------------------------------------------------------------
# Mini-task 2.2.1: Reusable Authenticated User Dependency
# -------------------------------------------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> models.User:
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token missing user identification claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer active or invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# -------------------------------------------------------------
# Mini-task 2.2.2: Reusable Role Authorization Factory
# -------------------------------------------------------------
def require_role(allowed_roles: List[str]):
    """
    Dependency factory returning a role enforcement guard.
    Blocks any request where the authenticated user's role is not in allowed_roles.
    """
    def role_checker(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Security Clearance Denied: Role '{current_user.role}' lacks authorization. Required: {allowed_roles}"
            )
        return current_user
    return role_checker
