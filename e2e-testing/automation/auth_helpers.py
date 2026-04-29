"""Business-level helpers for auth-server component tests.

These functions compose multiple :class:`automation.clients.auth.AuthClient`
calls (login, create user, fetch profile). Keep the httpx client itself thin;
put multi-step flows here so tests stay readable.
"""

from __future__ import annotations

from dataclasses import dataclass

from automation.clients.auth import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    AuthClient,
)
from automation.clients.auth_models import AccountType, TokenResponse, UserResponse


@dataclass(frozen=True, slots=True)
class BuiltinAdminSession:
    """OAuth session for the auth-server's seeded administrator account.

    The server ships ``test_admin`` / ``test_admin_password`` for integration
    testing (same credentials as ``AuthClient.ADMIN_*``). That account has full
    scopes, including ``users.read``, ``users.write``, and
    ``auth_settings.write``, so it can create disposable users and change
    settings during a test run.
    """

    username: str
    password: str
    token: TokenResponse


async def obtain_builtin_admin_session(client: AuthClient) -> BuiltinAdminSession:
    """Log in as ``test_admin`` and return a :class:`BuiltinAdminSession`."""

    token = await client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD)
    return BuiltinAdminSession(username=ADMIN_USERNAME, password=ADMIN_PASSWORD, token=token)


@dataclass(frozen=True, slots=True)
class ProvisionedTestUser:
    """A normal user created with ``POST /auth/users`` using an admin token.

    ``password`` is the cleartext password sent on create; use it with
    :meth:`AuthClient.get_token` if the test needs to act as this user.
    """

    user_name: str
    password: str
    full_name: str
    account_type: AccountType
    profile: UserResponse


async def create_test_user_under_admin(
    client: AuthClient,
    admin: BuiltinAdminSession,
    *,
    user_name: str,
    password: str,
    full_name: str,
    account_type: AccountType = "user",
) -> ProvisionedTestUser:
    """Create a user with ``POST /auth/users`` and return its profile."""

    profile = await client.create_user(
        admin.token,
        user_name=user_name,
        password=password,
        full_name=full_name,
        account_type=account_type,
    )
    return ProvisionedTestUser(
        user_name=user_name,
        password=password,
        full_name=full_name,
        account_type=account_type,
        profile=profile,
    )
