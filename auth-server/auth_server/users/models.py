from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Optional

from pydantic import BaseModel, Field, SecretStr

from auth_server.persistence.tables import AccountType

if TYPE_CHECKING:
    from auth_server.persistence.tables import User


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
            scopes=[scope.api_name for scope in user.scopes or []],
        )
