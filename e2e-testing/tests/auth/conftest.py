"""Fixtures for Flex auth-server HTTP tests against a real robot over HTTPS."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncIterator

import httpx
import pytest
from _pytest.config import Config
from _pytest.nodes import Item

from automation.auth_helpers import (
    AdminSession,
    ProvisionedTestUser,
    create_test_user_under_admin,
    obtain_admin_session,
    resolve_admin_credentials,
)
from automation.clients.auth import AuthClient
from automation.clients.auth_models import TokenResponse
from automation.demo_users import (
    DEFAULT_DEMO_PASSWORD,
    DEMO_AUDITOR_USERNAME,
    DEMO_OPERATOR_USERNAME,
    DEMO_SERVICE_USERNAME,
)

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
def robot_ip() -> str:
    """Flex robot IP or hostname from ``ROBOT_IP``."""

    ip = os.environ.get("ROBOT_IP", "").strip()
    if not ip:
        pytest.skip("Set ROBOT_IP to run auth_api tests against a Flex robot")
    return ip


@pytest.fixture(scope="session")
def admin_credentials(robot_ip: str) -> tuple[str, str]:
    """Admin credentials from ``AUTH_USERNAME`` / ``AUTH_PASSWORD``."""

    try:
        return resolve_admin_credentials()
    except ValueError as err:
        pytest.skip(str(err))


@pytest.fixture
async def auth_client(robot_ip: str) -> AsyncIterator[AuthClient]:
    """Async :class:`AuthClient` bound to ``robot_ip`` over HTTPS."""

    async with AuthClient(robot_ip) as client:
        yield client


@pytest.fixture
async def admin_session(auth_client: AuthClient, admin_credentials: tuple[str, str]) -> AdminSession:
    """Fresh ROPC token for the robot admin account."""

    return await obtain_admin_session(auth_client)


@pytest.fixture
async def provisioned_test_user(
    auth_client: AuthClient,
    admin_session: AdminSession,
) -> AsyncIterator[ProvisionedTestUser]:
    """Create a disposable ``user`` account and delete it after the test."""

    suffix = uuid.uuid4().hex[:12]
    user_name = f"e2e_user_{suffix}"
    user = await create_test_user_under_admin(
        auth_client,
        admin_session,
        user_name=user_name,
        password="e2e-test-password-9Z!",
        full_name="E2E disposable user",
        account_type="user",
    )
    try:
        yield user
    finally:
        try:
            await auth_client.delete_user(admin_session.token, user.user_name)
        except httpx.HTTPStatusError:
            pass


@pytest.fixture(autouse=True)
async def access_control_enabled_for_demo_user_tests(
    request: pytest.FixtureRequest,
    auth_client: AuthClient,
) -> AsyncIterator[None]:
    """Enable access control before demo-user matrix tests."""

    if "test_demo_" not in request.node.nodeid:
        yield
        return

    from automation.auth_access import ensure_access_control_enabled

    await ensure_access_control_enabled(auth_client)
    yield


@pytest.fixture
async def demo_operator_token(auth_client: AuthClient) -> TokenResponse:
    try:
        return await auth_client.get_token(DEMO_OPERATOR_USERNAME, DEFAULT_DEMO_PASSWORD)
    except httpx.HTTPStatusError as err:
        pytest.skip(
            f"Could not log in as {DEMO_OPERATOR_USERNAME!r}. "
            f"Run scripts/provision_demo_users.py first. ({err.response.status_code})"
        )


@pytest.fixture
async def demo_auditor_token(auth_client: AuthClient) -> TokenResponse:
    try:
        return await auth_client.get_token(DEMO_AUDITOR_USERNAME, DEFAULT_DEMO_PASSWORD)
    except httpx.HTTPStatusError as err:
        pytest.skip(
            f"Could not log in as {DEMO_AUDITOR_USERNAME!r}. "
            f"Run scripts/provision_demo_users.py first. ({err.response.status_code})"
        )


@pytest.fixture
async def demo_service_token(auth_client: AuthClient) -> TokenResponse:
    try:
        return await auth_client.get_token(DEMO_SERVICE_USERNAME, DEFAULT_DEMO_PASSWORD)
    except httpx.HTTPStatusError as err:
        pytest.skip(
            f"Could not log in as {DEMO_SERVICE_USERNAME!r}. "
            f"Run scripts/provision_demo_users.py first. ({err.response.status_code})"
        )


@pytest.fixture
def demo_tokens_by_role(
    demo_operator_token: TokenResponse,
    demo_auditor_token: TokenResponse,
    demo_service_token: TokenResponse,
) -> dict[str, TokenResponse]:
    return {
        "operator": demo_operator_token,
        "auditor": demo_auditor_token,
        "service": demo_service_token,
    }
