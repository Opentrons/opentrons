"""Token scope tests for the provisioned ``demo_operator`` account."""

from __future__ import annotations

import asyncio

import pytest

from automation.clients.auth import AuthClient
from automation.clients.auth_models import TokenResponse
from automation.demo_access_matrix import token_only_cases_for
from automation.demo_users import (
    DEMO_OPERATOR_USERNAME,
    OPERATOR_FORBIDDEN_SCOPES,
    OPERATOR_SCOPES,
)

pytestmark = pytest.mark.auth_api


@pytest.mark.auth_api
async def test_demo_operator_token_has_expected_scopes(
    auth_client: AuthClient,
    demo_operator_token: TokenResponse,
) -> None:
    intro, profile = await asyncio.gather(
        auth_client.introspect(demo_operator_token.access_token),
        auth_client.get_self(demo_operator_token),
    )

    assert intro.active is True
    assert intro.username == DEMO_OPERATOR_USERNAME

    token_scopes = set(demo_operator_token.scope.split())
    assert token_scopes == set(OPERATOR_SCOPES)
    assert OPERATOR_FORBIDDEN_SCOPES.isdisjoint(token_scopes)

    assert profile.account_type == "user"
    assert set(profile.scopes) == set(OPERATOR_SCOPES)

    token_only_scopes = {case.scope for case in token_only_cases_for("operator")}
    assert token_only_scopes.issubset(token_scopes)
