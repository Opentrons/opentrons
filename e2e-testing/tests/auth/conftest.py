"""Fixtures for Flex auth-server HTTP (component) tests."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator, Generator

import httpx
import pytest
from _pytest.config import Config
from _pytest.nodes import Item

from automation.auth_helpers import (
    BuiltinAdminSession,
    ProvisionedTestUser,
    create_test_user_under_admin,
    obtain_builtin_admin_session,
)
from automation.auth_server_runner import managed_auth_server_session
from automation.clients.auth import AuthClient

# Mutates server-wide access control; run after other ``auth_api`` tests on a shared session.
_ACCESS_CONTROL_TEST_SUBSTRING = "test_patch_access_control_enabled"


def pytest_collection_modifyitems(config: Config, items: list[Item]) -> None:
    """Order access-control PATCH tests last so earlier tests still see AC disabled."""

    tail = [i for i in items if _ACCESS_CONTROL_TEST_SUBSTRING in i.nodeid]
    if not tail:
        return
    head = [i for i in items if _ACCESS_CONTROL_TEST_SUBSTRING not in i.nodeid]
    items[:] = head + tail


@pytest.fixture(scope="session")
def auth_server_base_url() -> Generator[str, None, None]:
    """Yield ``http://127.0.0.1:<port>`` for a running auth-server (spawn or reuse)."""

    yield from managed_auth_server_session()


@pytest.fixture
async def auth_client(auth_server_base_url: str) -> AsyncIterator[AuthClient]:
    """Async :class:`AuthClient` bound to ``auth_server_base_url``."""

    async with AuthClient(auth_server_base_url) as client:
        yield client


@pytest.fixture
async def builtin_admin_session(auth_client: AuthClient) -> BuiltinAdminSession:
    """Fresh ROPC token for the seeded ``test_admin`` account (full scopes)."""

    return await obtain_builtin_admin_session(auth_client)


@pytest.fixture
async def provisioned_test_user(
    auth_client: AuthClient,
    builtin_admin_session: BuiltinAdminSession,
) -> AsyncIterator[ProvisionedTestUser]:
    """Create a disposable ``user`` account and delete it after the test."""

    suffix = uuid.uuid4().hex[:12]
    user_name = f"e2e_user_{suffix}"
    user = await create_test_user_under_admin(
        auth_client,
        builtin_admin_session,
        user_name=user_name,
        password="e2e-test-password-9Z!",
        full_name="E2E disposable user",
        account_type="user",
    )
    try:
        yield user
    finally:
        try:
            await auth_client.delete_user(builtin_admin_session.token, user.user_name)
        except httpx.HTTPStatusError:
            pass
