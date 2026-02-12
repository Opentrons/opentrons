from dataclasses import dataclass

from server_utils.auth.scopes import Scope


@dataclass(frozen=True)
class User:
    """Information about a given user account."""
    username: str
    password: str  # todo(mm, 2026-01-29): Plaintext for testing only. In the real world, this needs to be hashed.
    scopes: set[Scope]


# todo(mm, 2026-01-29): Delete these placeholder users when we have a real DB to store real users.
TEST_USERS = [
    User(
        username="test_admin",
        password="test_admin_password",
        scopes=set(Scope),
    ),
    User(
        username="test_user",
        password="test_user_password",
        scopes={Scope.RUNS_WRITE, Scope.RUNS_READ},
    ),
]
