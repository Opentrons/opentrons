import pytest
from decoy import Decoy

from server_utils.auth.resource_server.auth_server import (
    AuthSettingsResponse,
    AuthSettingsResponseData,
    Client,
    RequireReasonForInteractionSettingsResponse,
    RequireReasonForInteractionSettingsResponseData,
    TokenIntrospectionResponse,
)
from server_utils.auth.resource_server.authorization_checker import (
    AlwaysAllowedAuthorizationChecker,
    AuthorizationNotRequiredResult,
    AuthorizedResult,
    AuthServerAuthorizationChecker,
    InsufficientScopeResult,
    MissingTokenResult,
    NotAnActiveTokenResult,
)
from server_utils.auth.scopes import Scope, serialize_scopes


@pytest.fixture
def mock_client(decoy: Decoy) -> Client:
    """Return a mock in the shape of a client."""
    return decoy.mock(cls=Client)


class TestAlwaysAllowedAuthorizationChecker:
    async def test_get_require_reason_for_interaction_settings(self) -> None:
        subject = AlwaysAllowedAuthorizationChecker()
        settings = await subject.get_require_reason_for_interaction_settings()
        assert settings.data.requireReasonForInteraction is False
        assert await subject.is_reason_for_interaction_required() is False

    async def test_check(self) -> None:
        subject = AlwaysAllowedAuthorizationChecker()
        assert (
            await subject.check(token=None, required_scopes={Scope.USERS_WRITE})
            == AuthorizationNotRequiredResult()
        )
        assert (
            await subject.check(
                token="token-abc123", required_scopes={Scope.USERS_WRITE}
            )
            == AuthorizationNotRequiredResult()
        )


class TestAuthServerAuthorizationChecker:
    @pytest.fixture
    def mock_client(self, decoy: Decoy) -> Client:
        """Return a mock in the shape of a client."""
        return decoy.mock(cls=Client)

    async def test_get_require_reason_for_interaction_settings(
        self, mock_client: Client, decoy: Decoy
    ) -> None:
        subject = AuthServerAuthorizationChecker(mock_client)
        expected = RequireReasonForInteractionSettingsResponse(
            data=RequireReasonForInteractionSettingsResponseData(
                requireReasonForInteraction=True
            )
        )
        decoy.when(
            await mock_client.get_require_reason_for_interaction_settings()
        ).then_return(expected)
        decoy.when(await mock_client.get_auth_settings()).then_return(
            AuthSettingsResponse(
                data=AuthSettingsResponseData(accessControlEnabled=True)
            )
        )
        assert await subject.get_require_reason_for_interaction_settings() == expected
        assert await subject.is_reason_for_interaction_required() is True

    async def test_get_require_reason_disabled_when_access_control_off(
        self, mock_client: Client, decoy: Decoy
    ) -> None:
        subject = AuthServerAuthorizationChecker(mock_client)
        decoy.when(
            await mock_client.get_require_reason_for_interaction_settings()
        ).then_return(
            RequireReasonForInteractionSettingsResponse(
                data=RequireReasonForInteractionSettingsResponseData(
                    requireReasonForInteraction=True
                )
            )
        )
        decoy.when(await mock_client.get_auth_settings()).then_return(
            AuthSettingsResponse(
                data=AuthSettingsResponseData(accessControlEnabled=False)
            )
        )
        assert await subject.is_reason_for_interaction_required() is False

    async def test_check_given_no_token(
        self, mock_client: Client, decoy: Decoy
    ) -> None:
        """When there is no token, it should authorize the request if and only if access control is disabled."""
        subject = AuthServerAuthorizationChecker(mock_client)

        decoy.when(await mock_client.get_auth_settings()).then_return(
            AuthSettingsResponse(
                data=AuthSettingsResponseData(accessControlEnabled=True)
            )
        )
        assert (
            await subject.check(token=None, required_scopes={Scope.USERS_WRITE})
            == MissingTokenResult()
        )

        decoy.when(await mock_client.get_auth_settings()).then_return(
            AuthSettingsResponse(
                data=AuthSettingsResponseData(accessControlEnabled=False)
            )
        )
        assert (
            await subject.check(token=None, required_scopes={Scope.USERS_WRITE})
            == AuthorizationNotRequiredResult()
        )

    async def test_check_given_a_token(self, mock_client: Client, decoy: Decoy) -> None:
        """When there is a token, it should validate it by querying auth-server."""
        subject = AuthServerAuthorizationChecker(mock_client)

        # Active, and meeting all scopes -> authorize
        decoy.when(await mock_client.introspect_token("test-token-abc123")).then_return(
            TokenIntrospectionResponse(
                active=True,
                scope=serialize_scopes({Scope.ROBOT_CONTROL_WRITE, Scope.USERS_WRITE}),
                username="test-username",
            )
        )

        assert await subject.check(
            "test-token-abc123", {Scope.ROBOT_CONTROL_WRITE, Scope.USERS_WRITE}
        ) == AuthorizedResult(username="test-username")

        # Inactive -> do not authorize
        decoy.when(await mock_client.introspect_token("test-token-abc123")).then_return(
            TokenIntrospectionResponse(
                active=False,
                scope=serialize_scopes({Scope.ROBOT_CONTROL_WRITE, Scope.USERS_WRITE}),
            )
        )
        assert (
            await subject.check(
                "test-token-abc123", {Scope.ROBOT_CONTROL_WRITE, Scope.USERS_WRITE}
            )
            == NotAnActiveTokenResult()
        )

        # Not meeting all scopes -> do not authorize
        decoy.when(await mock_client.introspect_token("test-token-abc123")).then_return(
            TokenIntrospectionResponse(
                active=True, scope=serialize_scopes({Scope.ROBOT_CONTROL_WRITE})
            )
        )
        assert await subject.check(
            "test-token-abc123", {Scope.ROBOT_CONTROL_WRITE, Scope.USERS_WRITE}
        ) == InsufficientScopeResult(provided_scopes={Scope.ROBOT_CONTROL_WRITE})
