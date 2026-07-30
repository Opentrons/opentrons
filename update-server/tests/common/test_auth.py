"""Tests for the machinery that checks whether access to protected endpoints is authorized."""

import pytest

# Avoid pytest trying to collect TestClient because it begins with "Test".
from aiohttp.test_utils import TestClient as _TC
from aiohttp.web import Application, BaseRequest
from decoy import Decoy

from server_utils.auth.resource_server.authentication_checker import (
    AuthenticationChecker,
)
from server_utils.auth.resource_server.types import (
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
    MissingTokenResult,
    NotAnActiveTokenResult,
)
from server_utils.auth.scopes import Scope, serialize_scopes

HTTPTestClient = _TC[BaseRequest, Application]


@pytest.mark.filterwarnings("ignore::decoy.warnings.RedundantVerifyWarning")
@pytest.mark.parametrize(
    "header_value,expected_token",
    [
        (None, None),
        ("", None),
        ("foo bar baz", None),
        ("Bearer ", None),
        ("Bearer my-token", "my-token"),
        ("BeArEr my-token", "my-token"),
    ],
)
async def test_bearer_token_extraction_passed_to_checker(
    auth_test_cli: tuple[HTTPTestClient, AuthenticationChecker],
    decoy: Decoy,
    header_value: str | None,
    expected_token: str | None,
) -> None:
    """Test that the bearer token is correctly extracted from the request and passed to AuthenticationChecker.check."""
    client, mock_checker = auth_test_cli
    decoy.when(await mock_checker.check(expected_token)).then_return(
        AuthenticatedResult(
            username="test-username", fullname="test-fullname", scope=""
        )
    )
    # An arbitrary endpoint that requires authentication.
    await client.post(
        "/server/update/begin",
        headers={"Authorization": header_value} if header_value is not None else None,
    )

    decoy.verify(await mock_checker.check(expected_token))


async def test_authorized_result(
    auth_test_cli: tuple[HTTPTestClient, AuthenticationChecker],
    decoy: Decoy,
) -> None:
    """When the request is authorized, the request handler should run as normal."""
    client, mock_checker = auth_test_cli
    decoy.when(await mock_checker.check(None)).then_return(
        AuthenticatedResult(
            username="test-username",
            fullname="test-fullname",
            scope=serialize_scopes({Scope.UPDATES_WRITE}),
        )
    )

    # An arbitrary endpoint that requires authentication.
    resp = await client.post("/server/update/begin")

    assert resp.status == 201


async def test_auth_not_required_result(
    auth_test_cli: tuple[HTTPTestClient, AuthenticationChecker],
    decoy: Decoy,
) -> None:
    """When the authentication is disabled, the request handler should run as normal."""
    client, mock_checker = auth_test_cli
    decoy.when(await mock_checker.check(None)).then_return(
        AuthenticationNotRequiredResult()
    )

    # An arbitrary endpoint that requires authentication.
    resp = await client.post("/server/update/begin")

    assert resp.status == 201


@pytest.mark.parametrize(
    "authentication_result,expected_status,expected_provided_scopes",
    [
        (MissingTokenResult(), 401, []),
        (NotAnActiveTokenResult(), 401, []),
    ],
)
async def test_not_authenticated_result(
    auth_test_cli: tuple[HTTPTestClient, AuthenticationChecker],
    decoy: Decoy,
    authentication_result: MissingTokenResult | NotAnActiveTokenResult,
    expected_status: int,
    expected_provided_scopes: list[str],
) -> None:
    """When the request is unauthenticated, it should get mapped to an HTTP error response."""
    client, mock_checker = auth_test_cli
    decoy.when(await mock_checker.check(None)).then_return(authentication_result)

    # An arbitrary endpoint that requires authentication.
    resp = await client.post("/server/update/begin")

    assert resp.status == expected_status
    data = await resp.json()
    assert data["requiredScopes"] == ["updates.write"]
    assert data["providedScopes"] == []


async def test_not_authorized_result(
    auth_test_cli: tuple[HTTPTestClient, AuthenticationChecker],
    decoy: Decoy,
) -> None:
    """When the request is unauthorized, it should get mapped to an HTTP error response."""
    client, mock_checker = auth_test_cli
    decoy.when(await mock_checker.check(None)).then_return(
        AuthenticatedResult(
            username="user",
            fullname="full",
            scope=serialize_scopes({Scope.AUTH_SETTINGS_WRITE}),
        )
    )

    # An arbitrary endpoint that requires authentication.
    resp = await client.post("/server/update/begin")

    assert resp.status == 403
    data = await resp.json()
    assert data["requiredScopes"] == ["updates.write"]
    assert data["providedScopes"] == [Scope.AUTH_SETTINGS_WRITE.value]
