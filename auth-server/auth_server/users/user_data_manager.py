"""User data manager – business logic between the router and the store."""

import datetime
import secrets
import string

from pwdlib import PasswordHash

from auth_server.persistence.orm_models import User
from auth_server.settings.models import SettingsResponseData
from auth_server.settings.store import SettingsStore
from auth_server.users.is_account_locked import is_account_locked
from auth_server.users.models import (
    AccountType,
    TemporaryPasswordResponse,
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


def _validate_password_complexity(
    password: str, settings: SettingsResponseData
) -> None:
    """Validate that a user-chosen password meets configured complexity rules."""
    min_length, require_special = _password_complexity_requirements(settings)
    actual_length = len(password)
    if actual_length < min_length:
        raise PasswordTooShortError(
            actual_length=actual_length, required_length=min_length
        )
    if require_special and not any(c in _PASSWORD_SPECIAL_CHARACTERS for c in password):
        raise PasswordMissingSpecialCharactersError()


class UserNotFoundError(ValueError):
    """Raised when a requested user does not exist."""


class UserAlreadyExistsError(ValueError):
    """Raised when trying to create a user that already exists."""


class InvalidInputError(ValueError):
    """Raised when user input fails validation."""


class PasswordTooShortError(InvalidInputError):
    """Raised when a password does not meet the configured length requirements."""

    def __init__(self, *, actual_length: int, required_length: int) -> None:
        super().__init__(
            f"Required password length of {required_length} but got {actual_length}."
        )
        self.actual_length = actual_length
        self.required_length = required_length


class PasswordMissingSpecialCharactersError(InvalidInputError):
    """Raised when a password does not meet the configured requirements on special chars."""


class PasswordPreviouslyUsedError(InvalidInputError):
    """Raised when a new password matches the user's current password."""


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


def must_reset_password(
    user: User, now: datetime.datetime, password_reset_time_sec: float | None
) -> bool:
    """Return whether the user must reset their password before full robot access."""
    password_is_expired = (
        password_reset_time_sec is not None
        and now
        > user.password_set_at + datetime.timedelta(seconds=password_reset_time_sec)
    )
    return password_is_expired or user.reset_password


class UserDataManager:
    """Manages user data operations."""

    def __init__(self, user_store: UserStore, settings_store: SettingsStore) -> None:
        self._user_store = user_store
        self._settings_store = settings_store

    def _to_response(self, user: User) -> UserResponse:
        settings = self._settings_store.get_settings()
        is_failed_login_locked, _ = is_account_locked(
            failed_login_count=self._user_store.get_failed_login_count(user.username),
            max_attempts=settings.maxNumberOfLoginAttempts,
        )

        account_type = AccountType(user.account_type)
        now = datetime.datetime.now(tz=datetime.UTC)

        return UserResponse(
            username=user.username,
            fullName=user.full_name,
            accountType=account_type,
            locked=user.deactivated or is_failed_login_locked,
            resetPassword=must_reset_password(user, now, settings.passwordResetTime),
        )

    def create_user(
        self,
        username: str,
        password: str | None,
        full_name: str,
        account_type: str,
        now: datetime.datetime,
    ) -> TemporaryPasswordResponse:
        """Validate inputs, check for duplicates, and create a new user."""
        _validate_fields_non_empty(
            username=username,
            password=password,
            full_name=full_name,
            account_type=account_type,
        )
        settings = self._settings_store.get_settings()
        reset_password = password is None
        if reset_password:
            min_length, require_special = _password_complexity_requirements(settings)
            password = _generate_temporary_password(min_length, require_special)
        elif password is not None:
            _validate_password_complexity(password, settings)
        assert password is not None
        if self._user_store.get(username) is not None:
            raise UserAlreadyExistsError(f"User {username!r} already exists")
        new_user = self._user_store.add(
            username=username,
            hashed_password=password_hash.hash(password),
            full_name=full_name,
            account_type=account_type,
            now=now,
            reset_password=reset_password,
        )
        return TemporaryPasswordResponse(
            **self._to_response(new_user).model_dump(),
            temporaryPassword=password if reset_password else None,
        )

    def get_user(self, username: str) -> UserResponse:
        """Return the user or raise UserNotFoundError."""
        user = self._user_store.get(username)
        if user is None:
            raise UserNotFoundError(f"User {username!r} not found")
        return self._to_response(user)

    def get_users_list(self) -> list[UserResponse]:
        """Return all users."""
        return [self._to_response(user) for user in self._user_store.get_all()]

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
        new_locked: bool | None = None,
        reset_password: bool = False,
        *,
        now: datetime.datetime,
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
            existing_user = self._user_store.get(username_to_update)
            if existing_user is not None and password_hash.verify(
                new_password, existing_user.hashed_password
            ):
                raise PasswordPreviouslyUsedError(
                    "New password must be different from the current password."
                )
        if (
            new_username is not None
            and new_username != username_to_update
            and self._user_store.get(new_username) is not None
        ):
            raise UserAlreadyExistsError(f"User {new_username!r} already exists")
        try:
            deactivated: bool | None = None
            if new_locked is not None:
                if new_locked:
                    deactivated = True
                else:
                    # Note: do this BEFORE the username is potentially changed
                    self._user_store.clear_failed_logins(username_to_update)
                    deactivated = False
            if new_password is not None:
                reset_password = False
            updated_user = self._user_store.update(
                username_to_update,
                new_username=new_username,
                hashed_password=(
                    password_hash.hash(new_password)
                    if new_password is not None
                    else None
                ),
                full_name=new_full_name,
                account_type=new_account_type,
                reset_password=reset_password,
                deactivated=deactivated,
                now=now,
            )
            return self._to_response(updated_user)
        except ValueError as e:
            raise UserNotFoundError(e) from e

    def reset_user_password(
        self,
        username: str,
        now: datetime.datetime,
    ) -> TemporaryPasswordResponse:
        """Reset a user's password to a random temporary password.

        Clears failed login attempts so locked accounts become active again.
        Flag the account so the user is required to set a real password before
        doing anything else with the robot.
        """
        min_length, require_special = _password_complexity_requirements(
            self._settings_store.get_settings()
        )
        temporary_password = _generate_temporary_password(min_length, require_special)
        try:
            self._user_store.clear_failed_logins(username)
            updated_user = self._user_store.update(
                username,
                hashed_password=password_hash.hash(temporary_password),
                reset_password=True,
                deactivated=False,
                now=now,
            )
        except ValueError as e:
            raise UserNotFoundError(e) from e
        return TemporaryPasswordResponse(
            **self._to_response(updated_user).model_dump(),
            temporaryPassword=temporary_password,
        )
