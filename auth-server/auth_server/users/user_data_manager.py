"""User data manager – business logic between the router and the store."""

from pwdlib import PasswordHash

from server_utils.auth.scopes import Scope

from auth_server.persistence.tables import AccountType, User
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

    def __init__(self, user_store: UserStore) -> None:
        self._store = user_store

    def seed_initial_users(self) -> None:
        """Insert default placeholder users if they don't already exist."""
        defaults = [
            User(
                username="test_admin",
                hashed_password=password_hash.hash("test_admin_password"),
                scopes=list(Scope),
                full_name="Test Admin",
                account_type=AccountType.ADMIN,
            ),
            User(
                username="test_user",
                hashed_password=password_hash.hash("test_user_password"),
                scopes=[Scope.RUNS_WRITE],
                full_name="Test User",
                account_type=AccountType.USER,
            ),
        ]
        self._store.seed(defaults)

    def create_user(
        self,
        username: str,
        password: str,
        full_name: str,
        account_type: str,
        scopes: list[Scope],
    ) -> User:
        """Validate inputs, check for duplicates, and create a new user."""
        _validate_fields(
            user_name=username,
            password=password,
            full_name=full_name,
            account_type=account_type,
        )
        if self._store.get(username) is not None:
            raise UserAlreadyExistsError(f"User {username!r} already exists")
        return self._store.add(
            username=username,
            hashed_password=password_hash.hash(password),
            full_name=full_name,
            account_type=account_type,
            scopes=scopes,
        )

    def get_user(self, username: str) -> User:
        """Return the user or raise UserNotFoundError."""
        user = self._store.get(username)
        if user is None:
            raise UserNotFoundError(f"User {username!r} not found")
        return user

    def delete_user(self, username: str) -> None:
        """Delete a user or raise UserNotFoundError."""
        try:
            self._store.remove(username)
        except ValueError as e:
            raise UserNotFoundError(str(e)) from e

    def update_user(
        self,
        username: str,
        new_username: str | None = None,
        password: str | None = None,
        full_name: str | None = None,
        account_type: str | None = None,
    ) -> User:
        """Validate inputs, then update a user or raise UserNotFoundError."""
        _validate_fields(
            user_name=new_username,
            password=password,
            full_name=full_name,
            account_type=account_type,
        )
        try:
            return self._store.update(
                username,
                new_username=new_username,
                hashed_password=password_hash.hash(password)
                if password is not None
                else None,
                full_name=full_name,
                account_type=account_type,
            )
        except ValueError as e:
            raise UserNotFoundError(str(e)) from e
