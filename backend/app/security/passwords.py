# --------------------------------------------------
# Password hashing utilities
#
# This module centralizes all password hashing and
# verification logic so it can be reused throughout
# the application.
# --------------------------------------------------

from passlib.context import CryptContext

# --------------------------------------------------
# Configure the hashing algorithm.
# --------------------------------------------------
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

# --------------------------------------------------
# Hash a plain-text password.
# --------------------------------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# --------------------------------------------------
# Verify a password against its stored hash.
# --------------------------------------------------
def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )