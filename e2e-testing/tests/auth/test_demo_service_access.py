"""Token scope tests for the provisioned ``demo_service`` account."""

from __future__ import annotations

import asyncio

import pytest

from automation.clients.auth import AuthClient
from automation.clients.auth_models import TokenResponse
from automation.demo_access_matrix import token_only_cases_for
from automation.demo_users import (
    DEMO_ADMIN_USERNAME,
    DEMO_SERVICE_USERNAME,
    SERVICE_SCOPES,
)

pytestmark = pytest.mark.auth_api


@pytest.mark.auth_api
async def test_demo_service_token_has_expected_scopes(
    auth_client: AuthClient,
    demo_service_token: TokenResponse,
) -> None:
    intro, profile, admin_profile = await asyncio.gather(
        auth_client.introspect(demo_service_token.access_token),
        auth_client.get_self(demo_service_token),
        auth_client.get_user(demo_service_token, DEMO_ADMIN_USERNAME),
    )

    assert intro.active is True
    assert intro.username == DEMO_SERVICE_USERNAME

    token_scopes = set(demo_service_token.scope.split())
    assert token_scopes == set(SERVICE_SCOPES)

    token_only_scopes = {case.scope for case in token_only_cases_for("service")}
    assert token_only_scopes.issubset(token_scopes)

    assert profile.account_type == "service"
    assert set(profile.scopes) == set(SERVICE_SCOPES)
    assert admin_profile.account_type == "admin"
