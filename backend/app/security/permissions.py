# --------------------------------------------------
# Authorization helpers
#
# These dependencies control which authenticated
# users are allowed to access protected resources.
# --------------------------------------------------

from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.security.jwt import get_current_user


# --------------------------------------------------
# Require the user to be IT Staff or IT Admin.
# --------------------------------------------------
def require_it_staff_or_admin(
    current_user: User = Depends(get_current_user),
) -> User:

    if current_user.role not in [
        "it_staff",
        "it_admin",
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource",
        )

    return current_user


# --------------------------------------------------
# Require the user to be an IT Admin.
# --------------------------------------------------
def require_it_admin(
    current_user: User = Depends(get_current_user),
) -> User:

    if current_user.role != "it_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only IT admins can perform this action",
        )

    return current_user