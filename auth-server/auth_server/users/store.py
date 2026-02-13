from dataclasses import dataclass
from enum import StrEnum

from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

from .scopes import Scope

password_hash = PasswordHash(
    (
        # can we use default hashers? PasswordHash.recommended()
        Argon2Hasher(),
        BcryptHasher(),
    )
)


def hash_password(password: str) -> str:
    """Hash a password using the recommended hashers."""
    return password_hash.hash(password)


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
    scopes: set[Scope]


# todo(mm, 2026-01-29): Delete these placeholder users when we have a real DB to store real users.
TEST_USERS = [
    User(
        username="test_admin",
        hashed_password=hash_password("test_admin_password"),
        scopes=set(Scope),
        full_name="Test Admin",
        account_type=AccountType.ADMIN,
    ),
    User(
        username="test_user",
        hashed_password=hash_password("test_user_password"),
        scopes={Scope.RUNS_WRITE, Scope.RUNS_READ},
        full_name="Test User",
        account_type=AccountType.USER,
    ),
]
