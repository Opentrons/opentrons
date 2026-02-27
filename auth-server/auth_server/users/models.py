from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING, Annotated, Optional

from pydantic import BaseModel, Field, SecretStr

from server_utils.auth.scopes import Scope

# todo(tz, 2026-02-27): remove this when we move AccountType to its own file.
if TYPE_CHECKING:
    from auth_server.persistence.tables import User


# leave this outside of the db. this will not change.
class AccountType(StrEnum):
    """The type of account."""

    ADMIN = "admin"
    USER = "user"
    AUDITOR = "auditor"
    SERVICE = "service"


# move this to db if we need to support updating scopes.
ACCOUNT_TYPE_TO_SCOPES = {
    AccountType.ADMIN: list(Scope),  # all scopes
    AccountType.USER: [Scope.RUNS_WRITE],  # limited scopes
    AccountType.AUDITOR: [Scope.USERS_READ],
    AccountType.SERVICE: [Scope.RUNS_WRITE],
}


class UserCreate(BaseModel):
    """Request body for creating a user."""

    userName: Annotated[str, Field(..., description="The username of the user.")]
    password: Annotated[SecretStr, Field(..., description="The password for the user.")]
    fullName: Annotated[str, Field(..., description="The full name of the user.")]
    accountType: Annotated[
        AccountType, Field(..., description="The type of account for the user.")
    ]


class UpdateUser(BaseModel):
    """Request body for updating a user."""

    userName: Annotated[
        Optional[str], Field(..., description="The username of the user.")
    ] = None
    password: Annotated[
        Optional[SecretStr], Field(..., description="The password for the user.")
    ] = None
    fullName: Annotated[
        Optional[str], Field(..., description="The full name of the user.")
    ] = None
    accountType: Annotated[
        Optional[AccountType],
        Field(..., description="The type of account for the user."),
    ] = None


class UserResponse(BaseModel):
    """Response body for a user (no password)."""

    userName: str
    fullName: str
    accountType: AccountType
    scopes: list[str]

    @classmethod
    def from_orm_user(cls, user: User) -> UserResponse:
        """Build a UserResponse from an ORM User."""
        return cls(
            userName=user.username,  # type: ignore[arg-type]
            fullName=user.full_name,  # type: ignore[arg-type]
            accountType=user.account_type,  # type: ignore[arg-type]
            scopes=[
                scope.api_name
                for scope in ACCOUNT_TYPE_TO_SCOPES[AccountType(str(user.account_type))]
                or []
            ],
        )
