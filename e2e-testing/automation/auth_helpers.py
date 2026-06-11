"""Business-level helpers for Flex robot auth-server tests.

These functions compose multiple :class:`automation.clients.auth.AuthClient`
calls (login, create user, fetch profile). Keep the httpx client itself thin;
put multi-step flows here so tests stay readable.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from automation.clients.auth import AuthClient
from automation.clients.auth_models import AccountType, TokenResponse, UserResponse


@dataclass(frozen=True, slots=True)
class AdminSession:
    """OAuth session for a robot administrator account."""

    username: str
    password: str
    token: TokenResponse


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


def resolve_admin_credentials() -> tuple[str, str]:
    """Return ``(AUTH_USERNAME, AUTH_PASSWORD)`` from the environment."""
    username = os.environ.get("AUTH_USERNAME", "").strip()
    password = os.environ.get("AUTH_PASSWORD", "").strip()
    if not username or not password:
        raise ValueError("Set AUTH_USERNAME and AUTH_PASSWORD for robot auth tests")
    return username, password


async def obtain_admin_session(client: AuthClient) -> AdminSession:
    """Log in with ``AUTH_USERNAME`` / ``AUTH_PASSWORD`` and return a session."""

    username, password = resolve_admin_credentials()
    token = await client.get_token(username, password)
    return AdminSession(username=username, password=password, token=token)


async def create_test_user_under_admin(
    client: AuthClient,
    admin: AdminSession,
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
