from __future__ import annotations

from enum import StrEnum
from typing import Annotated, Literal, Self, Sequence, TypedDict

from pydantic import BaseModel, Field, SecretStr, model_validator

from server_utils.auth.scopes import Scope


# leave this outside of the db. this will not change.
class AccountType(StrEnum):
    """The type of account."""

    ADMIN = "admin"
    USER = "user"
    AUDITOR = "auditor"
    SERVICE = "service"


# move this to db if we need to support updating scopes.
ACCOUNT_TYPE_TO_SCOPES: dict[AccountType, set[Scope]] = {
    AccountType.ADMIN: set(Scope),  # all scopes
    AccountType.SERVICE: set(Scope),  # all scopes
    AccountType.USER: {
        Scope.RESTART_WRITE,
        Scope.ROBOT_CONTROL_WRITE,
        Scope.ROBOT_SETTINGS_WRITE,
        # todo(mm, 2026-03-17): Updates should be togglable to admin-only by an auth setting.
        Scope.UPDATES_WRITE,
        # todo(mm, 2026-03-17): Protocol uploads should be togglable to admin-only by an auth setting.
        Scope.USERS_READ_SELF,
        Scope.USERS_WRITE_SELF,
        Scope.USERS_WRITE_SELF_PASSWORD,
        Scope.PROTOCOLS_WRITE,
    },
    # Auditors should have read-only access to everything. Our read-only endpoints are
    # mostly accessible without authentication, but there are some exceptions. This
    # just needs to have the scopes to cover those exceptions.
    AccountType.AUDITOR: {Scope.USERS_READ_OTHERS},
}

# Scopes granted while resetPassword is true, before the user chooses a new password.
RESET_PASSWORD_SCOPES: set[Scope] = {
    Scope.USERS_READ_SELF,
    Scope.USERS_WRITE_SELF,
    Scope.USERS_WRITE_SELF_PASSWORD,
}


class UserCreate(BaseModel):
    """Request body for creating a user."""

    username: Annotated[str, Field(..., description="The username of the user.")]
    password: Annotated[SecretStr, Field(..., description="The password for the user.")]
    fullName: Annotated[str, Field(..., description="The full name of the user.")]
    accountType: Annotated[
        AccountType, Field(..., description="The type of account for the user.")
    ]


class UpdateUser(BaseModel):
    """Request body for updating a user."""

    username: Annotated[
        str | None,
        Field(description="The username of the user."),
    ] = None
    password: Annotated[
        SecretStr | None,
        Field(description="The password for the user."),
    ] = None
    fullName: Annotated[
        str | None,
        Field(description="The full name of the user."),
    ] = None
    accountType: Annotated[
        AccountType | None,
        Field(description="The type of account for the user."),
    ] = None
    locked: Annotated[
        Literal[False] | None,
        Field(
            description="Set to false to clear a failed-login lockout for this user.",
        ),
    ] = None
    resetPassword: Annotated[
        bool,
        Field(
            description="Set to true to require this user to change their password.",
            default=False,
        ),
    ] = False


class UpdateSelf(BaseModel):
    """Request body for updating the logged-in user."""

    username: Annotated[
        str | None,
        Field(default=None, description="The username of the user."),
    ] = None
    fullName: Annotated[
        str | None,
        Field(default=None, description="The full name of the user."),
    ] = None
    password: Annotated[
        SecretStr | None,
        Field(default=None, description="The new password for the user."),
    ] = None

    @model_validator(mode="after")
    def check_at_least_one_field(self) -> Self:
        if self.username is None and self.fullName is None and self.password is None:
            raise ValueError("At least one field must be provided")
        return self


class UserResponse(BaseModel):
    """Response body for a user (no password)."""

    username: str
    fullName: str
    accountType: AccountType
    scopes: list[str]
    locked: bool
    resetPassword: bool


class ResetPasswordResponse(UserResponse):
    """Response body for a password reset, including the new temporary password."""

    temporaryPassword: Annotated[
        str,
        Field(
            description="The newly generated temporary password for the user.",
        ),
    ]


# todo(mm, 2026-06-23): Deduplicate with robot-server's ErrorBody, via server-utils.
class ErrorBody[ErrorDetailsT](BaseModel):
    """A general error response envelope. More specific details will be inside `errors`."""

    errors: Sequence[ErrorDetailsT]


class PasswordTooShortErrorDetails(BaseModel):
    """An error when a new password does not meet the configured length requirements."""

    id: Literal["passwordTooShort"]
    meta: _PasswordTooShortMeta


class _PasswordTooShortMeta(TypedDict):
    """Extra error information specific to PasswordTooShortErrorDetails."""

    requiredLength: int
    actualLength: int


class PasswordMissingSpecialCharactersErrorDetails(BaseModel):
    """An error response when a new password does not meet the configured special characters requirements."""

    id: Literal["passwordMissingSpecialCharacters"]


class UserAlreadyExistsErrorDetails(BaseModel):
    """An error when a username is already taken."""

    id: Literal["userAlreadyExists"]
