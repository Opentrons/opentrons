"""Tests for the authentication checker."""

import pytest
from decoy import Decoy

from server_utils.auth.resource_server.auth_server import Client
from server_utils.auth.resource_server.authentication_checker import (
    AlwaysAllowedAuthenticationChecker,
    AuthServerAuthenticationChecker,
    FailedClosedAuthenticationChecker,
)
from server_utils.auth.resource_server.types import (
    AuthenticatedResult,
    AuthenticationNotRequiredResult,
    AuthSettingsResponse,
    AuthSettingsResponseData,
    MissingTokenResult,
    NotAnActiveTokenResult,
    TokenIntrospectionResponse,
    UnableToContactAuthServerResult,
)
from server_utils.auth.scopes import serialize_scopes


@pytest.fixture
def mock_client(decoy: Decoy) -> Client:
    """Return a mock in the shape of a client."""
    return decoy.mock(cls=Client)


@pytest.fixture
def subject_always_allowed() -> AlwaysAllowedAuthenticationChecker:
    return AlwaysAllowedAuthenticationChecker()


@pytest.fixture
def subject_failed_closed() -> FailedClosedAuthenticationChecker:
    return FailedClosedAuthenticationChecker()


@pytest.fixture
def subject(mock_client: Client) -> AuthServerAuthenticationChecker:
    return AuthServerAuthenticationChecker(client=mock_client)


async def test_always_allowed_authentication_checker_passes_with_no_token(
    subject_always_allowed: AlwaysAllowedAuthenticationChecker,
) -> None:
    """It should pass an empty token."""
    assert (
        await subject_always_allowed.check(token=None)
    ) == AuthenticationNotRequiredResult()


async def test_always_allowed_authentication_checker_passes_with_random_token(
    subject_always_allowed: AlwaysAllowedAuthenticationChecker,
) -> None:
    """It should pass a random token."""
    assert (
        await subject_always_allowed.check(token="asofhalsdasd")
    ) == AuthenticationNotRequiredResult()


async def test_failed_closed_authentication_checker_fails_with_no_token(
    subject_failed_closed: FailedClosedAuthenticationChecker,
) -> None:
    """It should fail an empty token."""
    assert (
        await subject_failed_closed.check(token=None)
    ) == UnableToContactAuthServerResult()


async def test_failed_closed_authentication_checker_fails_with_random_token(
    subject_failed_closed: FailedClosedAuthenticationChecker,
) -> None:
    """It should fail a random token."""
    assert (
        await subject_failed_closed.check(token="asdlkajsdasd")
    ) == UnableToContactAuthServerResult()


async def test_allow_no_token_if_acm_off(
    subject: AuthServerAuthenticationChecker, mock_client: Client, decoy: Decoy
) -> None:
    """If ACM is off, a request with no token should be allowed."""
    decoy.when(await mock_client.get_auth_settings()).then_return(
        AuthSettingsResponse(data=AuthSettingsResponseData(accessControlEnabled=False))
    )
    assert await subject.check(token=None) == AuthenticationNotRequiredResult()


async def test_forbid_no_token_if_acm_on(
    subject: AuthServerAuthenticationChecker, mock_client: Client, decoy: Decoy
) -> None:
    """If ACM is on, a request with no token should be forbidden."""
    decoy.when(await mock_client.get_auth_settings()).then_return(
        AuthSettingsResponse(data=AuthSettingsResponseData(accessControlEnabled=True))
    )
    assert await subject.check(token=None) == MissingTokenResult()


async def test_auth_server_checked_even_if_acm_off(
    subject: AuthServerAuthenticationChecker, mock_client: Client, decoy: Decoy
) -> None:
    """If a token is provided, the auth server should always be checked."""
    decoy.when(await mock_client.get_auth_settings()).then_return(
        AuthSettingsResponse(data=AuthSettingsResponseData(accessControlEnabled=False))
    )
    decoy.when(await mock_client.introspect_token("asdasf")).then_return(
        TokenIntrospectionResponse(
            active=False, username="hi", ot_fullname="lo", scope=serialize_scopes(set())
        )
    )
    assert await subject.check("asdasf") == NotAnActiveTokenResult()


async def test_fails_inactive_token(
    subject: AuthServerAuthenticationChecker, mock_client: Client, decoy: Decoy
) -> None:
    """it should fail an inactive token."""
    decoy.when(await mock_client.get_auth_settings()).then_return(
        AuthSettingsResponse(data=AuthSettingsResponseData(accessControlEnabled=True))
    )
    decoy.when(await mock_client.introspect_token("asdasf")).then_return(
        TokenIntrospectionResponse(
            active=False, username="hi", ot_fullname="lo", scope=serialize_scopes(set())
        )
    )
    assert await subject.check("asdasf") == NotAnActiveTokenResult()


async def test_passes_active_token(
    subject: AuthServerAuthenticationChecker, mock_client: Client, decoy: Decoy
) -> None:
    """It should pass a valid active token."""
    decoy.when(await mock_client.get_auth_settings()).then_return(
        AuthSettingsResponse(data=AuthSettingsResponseData(accessControlEnabled=True))
    )
    decoy.when(await mock_client.introspect_token("asdasf")).then_return(
        TokenIntrospectionResponse(
            active=True,
            username="hi",
            ot_fullname="lo",
            ot_account_type="user",
            scope=serialize_scopes(set()),
        )
    )
    assert await subject.check("asdasf") == AuthenticatedResult(
        scope="", username="hi", fullname="lo", account_type="user"
    )
