# --------------------------------------------------
# JWT authentication utilities
#
# This module handles:
# - OAuth2 token extraction
# - JWT creation
# - JWT decoding
# - Current-user lookup
# --------------------------------------------------

from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User


# --------------------------------------------------
# JWT configuration
#
# This should eventually move into environment-based
# application settings.
# --------------------------------------------------
SECRET_KEY = "temporary-dev-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# --------------------------------------------------
# OAuth2 configuration
#
# FastAPI uses this dependency to read the bearer
# token from the Authorization header.
# --------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# --------------------------------------------------
# Create a signed JWT access token.
# --------------------------------------------------
def create_access_token(data: dict) -> str:
    token_data = data.copy()

    expires_at = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    token_data.update({
        "exp": expires_at,
    })

    return jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# --------------------------------------------------
# Decode the JWT and return the logged-in user.
# --------------------------------------------------
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate login credentials",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        email = payload.get("sub")

        if email is None:
            raise credentials_exception

    except Exception:
        raise credentials_exception

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None:
        raise credentials_exception

    return user