from dataclasses import dataclass
from typing import Annotated, Optional

from pydantic import BaseModel, Field, SecretStr

from server_utils.auth.scopes import Scope

from auth_server.users.store import AccountType


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
