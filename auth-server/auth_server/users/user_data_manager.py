"""User data manager – business logic between the router and the store."""

from typing import Literal

from pwdlib import PasswordHash

from auth_server.persistence.orm_models import User
from auth_server.settings.store import SettingsStore
from auth_server.users.is_account_locked import is_account_locked
from auth_server.users.models import ACCOUNT_TYPE_TO_SCOPES, AccountType, UserResponse
from auth_server.users.store import UserStore

password_hash = PasswordHash.recommended()


class UserNotFoundError(ValueError):
    """Raised when a requested user does not exist."""


class UserAlreadyExistsError(ValueError):
    """Raised when trying to create a user that already exists."""


class InvalidInputError(ValueError):
    """Raised when user input fails validation."""


def _validate_fields(
    user_name: str | None = None,
    password: str | None = None,
    full_name: str | None = None,
    account_type: str | None = None,
) -> None:
    """Validate that provided fields are non-empty and passwords meet length requirements."""
    for field_name, value in [
        ("userName", user_name),
        ("password", password),
        ("fullName", full_name),
        ("accountType", account_type),
    ]:
        if value is not None and value == "":
            raise InvalidInputError(f"{field_name} must not be empty")

    if password is not None and len(password) < 8:
        raise InvalidInputError("Password must be at least 8 characters long")


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

        return UserResponse(
            userName=user.username,
            fullName=user.full_name,
            accountType=account_type,
            scopes=sorted(
                scope.api_name for scope in ACCOUNT_TYPE_TO_SCOPES[account_type]
            ),
            locked=is_currently_locked,
            resetPassword=user.reset_password,
        )

    def seed_initial_users(self) -> None:
        """Insert default placeholder users if they don't already exist."""
        defaults = [
            User(
                username="test_admin",
                hashed_password=password_hash.hash("test_admin_password"),
                full_name="Test Admin",
                account_type=AccountType.ADMIN,
            ),
            User(
                username="test_user",
                hashed_password=password_hash.hash("test_user_password"),
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
        _validate_fields(
            user_name=username,
            password=password,
            full_name=full_name,
            account_type=account_type,
        )
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
        _validate_fields(
            user_name=new_username,
            password=new_password,
            full_name=new_full_name,
            account_type=new_account_type,
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
