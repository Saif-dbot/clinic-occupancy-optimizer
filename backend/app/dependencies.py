from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, Header, HTTPException, status

from app.schemas import Role


def get_actor_role(x_role: str | None = Header(default=None)) -> Role:
    raw_role = (x_role or "admin").strip().lower()
    allowed_roles: tuple[Role, ...] = ("admin", "secretaire", "medecin", "client")
    if raw_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{raw_role}'. Expected one of: {', '.join(allowed_roles)}",
        )
    return raw_role


def require_roles(*roles: Role) -> Callable[[Role], Role]:
    allowed = set(roles)

    def _enforce(actor_role: Role = Depends(get_actor_role)) -> Role:
        if actor_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Role not allowed for this endpoint",
            )
        return actor_role

    return _enforce
