"""Tests for the machinery that checks whether access to protected endpoints is authorized."""

import pytest

# Avoid pytest trying to collect TestClient because it begins with "Test".
from aiohttp.test_utils import TestClient as _TC
from aiohttp.web import Application, BaseRequest
from decoy import Decoy, matchers

from server_utils.auth.resource_server.authorization_checker import (
    AuthorizationChecker,
    AuthorizedResult,
    InsufficientScopeResult,
    MissingTokenResult,
    NotAnActiveTokenResult,
)
from server_utils.auth.scopes import Scope

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
    auth_test_cli: tuple[HTTPTestClient, AuthorizationChecker],
    decoy: Decoy,
    header_value: str | None,
    expected_token: str | None,
) -> None:
    """Test that the bearer token is correctly extracted from the request and passed to AuthorizationChecker.check."""
    client, mock_checker = auth_test_cli
    decoy.when(
        await mock_checker.check(matchers.Anything(), matchers.Anything())
    ).then_return(AuthorizedResult(username="test-username", fullname="test-fullname"))

    # An arbitrary endpoint that requires authorization.
    await client.post(
        "/server/update/begin",
        headers={"Authorization": header_value} if header_value is not None else None,
    )

    decoy.verify(await mock_checker.check(expected_token, matchers.Anything()))


async def test_authorized_result(
    auth_test_cli: tuple[HTTPTestClient, AuthorizationChecker],
    decoy: Decoy,
) -> None:
    """When the AuthorizationChecker returns an AuthorizedResult, the request handler should run as normal."""
    client, mock_checker = auth_test_cli
    decoy.when(await mock_checker.check(None, matchers.Anything())).then_return(
        AuthorizedResult(username="test-username", fullname="test-fullname")
    )

    # An arbitrary endpoint that requires authorization.
    resp = await client.post("/server/update/begin")

    assert resp.status == 201


@pytest.mark.parametrize(
    "authorization_result,expected_status,expected_provided_scopes",
    [
        (MissingTokenResult(), 401, []),
        (NotAnActiveTokenResult(), 401, []),
        (
            InsufficientScopeResult(provided_scopes={Scope.ROBOT_CONTROL_WRITE}),
            403,
            [Scope.ROBOT_CONTROL_WRITE.api_name],
        ),
    ],
)
async def test_not_authorized_result(
    auth_test_cli: tuple[HTTPTestClient, AuthorizationChecker],
    decoy: Decoy,
    authorization_result: (
        MissingTokenResult | NotAnActiveTokenResult | InsufficientScopeResult
    ),
    expected_status: int,
    expected_provided_scopes: list[str],
) -> None:
    """When the AuthorizationChecker returns an unauthorized result, it should get mapped to an HTTP error response."""
    client, mock_checker = auth_test_cli
    decoy.when(await mock_checker.check(None, matchers.Anything())).then_return(
        authorization_result
    )

    # An arbitrary endpoint that requires authorization.
    resp = await client.post("/server/update/begin")

    assert resp.status == expected_status
    data = await resp.json()
    assert data["requiredScopes"] == ["updates.write"]
    assert data["providedScopes"] == expected_provided_scopes
