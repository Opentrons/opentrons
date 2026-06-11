"""Token scope tests for the provisioned ``demo_auditor`` account."""

from __future__ import annotations

import asyncio

import pytest

from automation.clients.auth import AuthClient
from automation.clients.auth_models import TokenResponse
from automation.demo_users import (
    AUDITOR_FORBIDDEN_SCOPES,
    AUDITOR_SCOPES,
    DEMO_ADMIN_USERNAME,
    DEMO_AUDITOR_USERNAME,
)

pytestmark = pytest.mark.auth_api


@pytest.mark.auth_api
async def test_demo_auditor_token_has_expected_scopes(
    auth_client: AuthClient,
    demo_auditor_token: TokenResponse,
) -> None:
    intro, admin_profile, self_profile = await asyncio.gather(
        auth_client.introspect(demo_auditor_token.access_token),
        auth_client.get_user(demo_auditor_token, DEMO_ADMIN_USERNAME),
        auth_client.get_user(demo_auditor_token, DEMO_AUDITOR_USERNAME),
    )

    assert intro.active is True
    assert intro.username == DEMO_AUDITOR_USERNAME

    token_scopes = set(demo_auditor_token.scope.split())
    assert token_scopes == set(AUDITOR_SCOPES)
    assert AUDITOR_FORBIDDEN_SCOPES.isdisjoint(token_scopes)

    assert admin_profile.account_type == "admin"
    assert self_profile.account_type == "auditor"
    assert set(self_profile.scopes) == set(AUDITOR_SCOPES)
