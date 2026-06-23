"""User data manager – business logic between the router and the store."""

import secrets
import string
from typing import Literal

from pwdlib import PasswordHash

from server_utils.auth.scopes import Scope

from auth_server.persistence.orm_models import User
from auth_server.settings.models import SettingsResponseData
from auth_server.settings.store import SettingsStore
from auth_server.users.is_account_locked import is_account_locked
from auth_server.users.models import (
    ACCOUNT_TYPE_TO_SCOPES,
    RESET_PASSWORD_SCOPES,
    AccountType,
    ResetPasswordResponse,
    UserResponse,
)
from auth_server.users.store import UserStore

password_hash = PasswordHash.recommended()

_DEFAULT_MIN_PASSWORD_LENGTH = 8
_ALPHANUMERIC = string.ascii_letters + string.digits
_PASSWORD_SPECIAL_CHARACTERS = string.punctuation


def _generate_temporary_password(
    min_length: int, require_special_characters: bool
) -> str:
    """Generate a random password that satisfies the given complexity rules."""
    if not require_special_characters:
        return "".join(secrets.choice(_ALPHANUMERIC) for _ in range(min_length))

    return "".join(
        secrets.choice(_ALPHANUMERIC + _PASSWORD_SPECIAL_CHARACTERS)
        for _ in range(min_length)
    )


def _password_complexity_requirements(
    settings: SettingsResponseData,
) -> tuple[int, bool]:
    """Return (min_length, require_special_characters) from auth settings."""
    min_length = (
        settings.passwordComplexityMinimumLength or _DEFAULT_MIN_PASSWORD_LENGTH
    )
    require_special = settings.passwordComplexitySpecialCharacters is True
    return min_length, require_special


def _validate_password_complexity(password: str, settings: SettingsResponseData) -> None:
    """Validate that a user-chosen password meets configured complexity rules."""
    min_length, require_special = _password_complexity_requirements(settings)
    if len(password) < min_length:
        raise InvalidInputError(
            f"Password must be at least {min_length} characters long"
        )
    if require_special and not any(c in _PASSWORD_SPECIAL_CHARACTERS for c in password):
        raise InvalidInputError("Password must contain at least one special character")


class UserNotFoundError(ValueError):
    """Raised when a requested user does not exist."""


class UserAlreadyExistsError(ValueError):
    """Raised when trying to create a user that already exists."""


class InvalidInputError(ValueError):
    """Raised when user input fails validation."""


def _validate_fields_non_empty(
    username: str | None = None,
    password: str | None = None,
    full_name: str | None = None,
    account_type: str | None = None,
) -> None:
    """Validate that provided fields are non-empty."""
    for field_name, value in [
        ("username", username),
        ("password", password),
        ("fullName", full_name),
        ("accountType", account_type),
    ]:
        if value is not None and value == "":
            raise InvalidInputError(f"{field_name} must not be empty")


def get_scope_set_of_user(user: User) -> set[Scope]:
    """Return the scopes that a user is authorized for.

    A user who must reset their password is restricted to reading and writing their
    own account, so they can change their password but nothing else until they do.
    """
    if user.reset_password:
        return set(RESET_PASSWORD_SCOPES)
    return set(ACCOUNT_TYPE_TO_SCOPES[AccountType(user.account_type)])


class UserDataManager:
    """Manages user data operations."""

    def __init__(self, user_store: UserStore, settings_store: SettingsStore) -> None:
        self._user_store = user_store
        self._settings_store = settings_store

    def _to_response(self, user: User) -> UserResponse:
        is_currently_locked, _ = is_account_locked(
            failed_login_count=self._user_store.get_failed_login_count(user.username),
            max_attempts=self._settings_store.get_settings().maxNumberOfLoginAttempts,
        )

        account_type = AccountType(user.account_type)
        scopes = sorted(scope.api_name for scope in get_scope_set_of_user(user))

        return UserResponse(
            username=user.username,
            fullName=user.full_name,
            accountType=account_type,
            scopes=scopes,
            locked=is_currently_locked,
            resetPassword=user.reset_password,
        )

    def seed_initial_users(self) -> None:
        """Insert default placeholder users if they don't already exist."""
        defaults = [
            User(
                username="testadmin",
                hashed_password=password_hash.hash("testadminpassword"),
                full_name="Test Admin",
                account_type=AccountType.ADMIN,
            ),
            User(
                username="testuser",
                hashed_password=password_hash.hash("testuserpassword"),
                full_name="Test User",
                account_type=AccountType.USER,
            ),
        ]
        self._user_store.seed(defaults)

    def create_user(
        self,
        username: str,
        password: str,
        full_name: str,
        account_type: str,
    ) -> UserResponse:
        """Validate inputs, check for duplicates, and create a new user."""
        _validate_fields_non_empty(
            username=username,
            password=password,
            full_name=full_name,
            account_type=account_type,
        )
        _validate_password_complexity(password, self._settings_store.get_settings())
        if self._user_store.get(username) is not None:
            raise UserAlreadyExistsError(f"User {username!r} already exists")
        new_user = self._user_store.add(
            username=username,
            hashed_password=password_hash.hash(password),
            full_name=full_name,
            account_type=account_type,
        )
        return self._to_response(new_user)

    def get_user(self, username: str) -> UserResponse:
        """Return the user or raise UserNotFoundError."""
        user = self._user_store.get(username)
        if user is None:
            raise UserNotFoundError(f"User {username!r} not found")
        return self._to_response(user)

    def delete_user(self, username: str) -> None:
        """Delete a user or raise UserNotFoundError."""
        try:
            self._user_store.remove(username)
        except ValueError as e:
            raise UserNotFoundError(e) from e

    def update_user(
        self,
        username_to_update: str,
        new_username: str | None = None,
        new_password: str | None = None,
        new_full_name: str | None = None,
        new_account_type: str | None = None,
        new_locked: Literal[False] | None = None,
        reset_password: bool = False,
    ) -> UserResponse:
        """Validate inputs, then update a user or raise UserNotFoundError."""
        _validate_fields_non_empty(
            username=new_username,
            password=new_password,
            full_name=new_full_name,
            account_type=new_account_type,
        )
        if new_password is not None:
            _validate_password_complexity(
                new_password, self._settings_store.get_settings()
            )
        if (
            new_username is not None
            and new_username != username_to_update
            and self._user_store.get(new_username) is not None
        ):
            raise UserAlreadyExistsError(f"User {new_username!r} already exists")
        try:
            if new_locked is not None and not new_locked:
                # Note: do this BEFORE the username is potentially changed
                self._user_store.clear_failed_logins(username_to_update)
            if new_password is not None:
                reset_password = False
            updated_user = self._user_store.update(
                username_to_update,
                new_username=new_username,
                hashed_password=password_hash.hash(new_password)
                if new_password is not None
                else None,
                full_name=new_full_name,
                account_type=new_account_type,
                reset_password=reset_password,
            )
            return self._to_response(updated_user)
        except ValueError as e:
            raise UserNotFoundError(e) from e

    def reset_user_password(self, username: str) -> ResetPasswordResponse:
        """Reset a user's password to a random temporary password."""
        min_length, require_special = _password_complexity_requirements(
            self._settings_store.get_settings()
        )
        temporary_password = _generate_temporary_password(min_length, require_special)
        try:
            updated_user = self._user_store.update(
                username,
                hashed_password=password_hash.hash(temporary_password),
                reset_password=True,
            )
        except ValueError as e:
            raise UserNotFoundError(e) from e
        user_response = self._to_response(updated_user)
        return ResetPasswordResponse(
            **user_response.model_dump(),
            temporaryPassword=temporary_password,
        )
