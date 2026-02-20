from dataclasses import dataclass
from enum import StrEnum

from pwdlib import PasswordHash

from server_utils.auth.scopes import Scope

password_hash = PasswordHash.recommended()


class AccountType(StrEnum):
    """The type of account."""

    ADMIN = "admin"
    USER = "user"
    AUDITOR = "auditor"
    SERVICE = "service"


@dataclass(frozen=True)
class User:
    """Information about a given user account."""

    username: str
    hashed_password: str
    full_name: str
    account_type: AccountType
    scopes: list[Scope]


# todo(mm, 2026-01-29): Delete these placeholder users when we have a real DB to store real users.
TEST_USERS = [
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
        scopes=[Scope.RUNS_WRITE, Scope.RUNS_READ],
        full_name="Test User",
        account_type=AccountType.USER,
    ),
]


def get(username: str) -> User | None:
    """Look up a user by username. Returns the User or None."""
    return next(
        (user for user in TEST_USERS if user.username == username),
        None,
    )


def add(
    username: str, password: str, full_name: str, account_type: str, scopes: list[Scope]
) -> User:
    """Add a user to the TEST_USERS list."""
    new_user = User(
        username=username,
        hashed_password=password_hash.hash(password),
        full_name=full_name,
        account_type=AccountType(account_type),
        scopes=scopes,
    )
    TEST_USERS.append(new_user)
    return new_user


def remove(user: User) -> None:
    """Remove a user from the TEST_USERS list."""
    TEST_USERS.remove(user)


def update(
    user: User,
    username: str | None = None,
    password: str | None = None,
    full_name: str | None = None,
    account_type: str | None = None,
) -> User:
    """Update a user in the TEST_USERS list and return the updated User."""
    updated_user = User(
        username=username or user.username,
        hashed_password=(
            password_hash.hash(password)
            if password is not None
            else user.hashed_password
        ),
        full_name=full_name or user.full_name,
        account_type=AccountType(account_type) if account_type else user.account_type,
        scopes=user.scopes,
    )
    idx = TEST_USERS.index(user)
    TEST_USERS[idx] = updated_user
    return updated_user
