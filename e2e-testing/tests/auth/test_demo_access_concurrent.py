"""Concurrent HTTPS access-control probes for all demo user accounts."""

from __future__ import annotations

import pytest

from automation.clients.auth import AuthClient
from automation.clients.auth_models import TokenResponse
from automation.demo_access_matrix import HTTP_ACCESS_CASES, LOGIN_SCOPE_CASES
from automation.demo_access_runner import (
    run_http_access_cases_concurrently,
    run_login_scope_cases_concurrently,
)
from automation.demo_users import (
    DEFAULT_DEMO_PASSWORD,
    DEMO_AUDITOR_USERNAME,
    DEMO_OPERATOR_USERNAME,
    DEMO_SERVICE_USERNAME,
)

pytestmark = pytest.mark.auth_api

_DEMO_USERNAMES = {
    "operator": DEMO_OPERATOR_USERNAME,
    "auditor": DEMO_AUDITOR_USERNAME,
    "service": DEMO_SERVICE_USERNAME,
}


@pytest.mark.auth_api
async def test_demo_users_http_access_concurrent(
    auth_client: AuthClient,
    demo_tokens_by_role: dict[str, TokenResponse],
) -> None:
    """Fire every matrix HTTP probe concurrently (per user token, mixed account types)."""

    await run_http_access_cases_concurrently(
        auth_client,
        demo_tokens_by_role,
        HTTP_ACCESS_CASES,
    )


@pytest.mark.auth_api
async def test_demo_users_login_scope_concurrent(auth_client: AuthClient) -> None:
    """Exercise every matrix login-scope case concurrently."""

    await run_login_scope_cases_concurrently(
        auth_client,
        usernames_by_role=_DEMO_USERNAMES,
        password=DEFAULT_DEMO_PASSWORD,
        cases=LOGIN_SCOPE_CASES,
    )
