"""Setup to help this server enforce access control on its own endpoints.

For background, this server acts as both:

* An authorization server. We check user credentials, and return tokens to clients that
  grant them access to various protected resources across the robot's HTTP APIs.
* A resource server. We have our own protected resources, like `/auth/settings` and
  `/auth/users`.

This module helps with the resource server part, not the authorization server part.
For the authorization server part, see the `oauth2` directory.

Other resource servers, like robot-server, implement access control with an
`AuthenticationChecker` that queries the auth-server (us) over a local HTTP request.
(See the utilities in `server_utils`.) We want to share as much of that logic as
possible, but we can't do it exactly the same way, because we *are* the auth server,
and we don't have a clean way to connect to ourselves over HTTP. So, we use a special
customized `AuthenticationChecker` that retrieves data directly from our internal stores
instead of going over HTTP. We get to use the same _authorization_ mechanics as everything else.
"""

from typing import Annotated, override

import fastapi

from server_utils.auth.resource_server.auth_server import (
    CLIENT_ID,
    Client,
)
from server_utils.auth.resource_server.authentication_checker import (
    AuthenticationChecker,
    AuthServerAuthenticationChecker,
)
from server_utils.auth.resource_server.types import (
    AuthSettingsResponse,
    TokenIntrospectionRequestFormData,
    TokenIntrospectionResponse,
)

from auth_server.oauth2.backend import Backend as OAuth2Backend
from auth_server.oauth2.fastapi_dependencies import get_oauth2_backend
from auth_server.settings.store import (
    SettingsStore,
    get_settings_store,
)


def build_authentication_checker(
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
    oauth2_backend: Annotated[OAuth2Backend, fastapi.Depends(get_oauth2_backend)],
) -> AuthenticationChecker:
    """Construct the server's singleton `AuthenticationChecker`."""
    return AuthServerAuthenticationChecker(
        client=_SelfClient(settings_store, oauth2_backend)
    )


class _SelfClient(Client):
    """A client implementation where this server queries auth info from itself."""

    def __init__(
        self,
        settings_store: SettingsStore,
        oauth2_backend: OAuth2Backend,
    ) -> None:
        self._settings_store = settings_store
        self._oauth2_backend = oauth2_backend

    @override
    async def get_auth_settings(self) -> AuthSettingsResponse:
        # Mimic an HTTP response body from our own /auth/settings endpoint.
        access_control_enabled = (
            self._settings_store.get_access_control_settings().accessControlEnabled
        )
        response_body = {"data": {"accessControlEnabled": access_control_enabled}}
        converted_response_body = AuthSettingsResponse.model_validate(response_body)
        return converted_response_body

    @override
    async def introspect_token(self, token: str) -> TokenIntrospectionResponse:
        # Mimic an HTTP request and response from our own /auth/oauth2/introspect endpoint.
        request_form_data: TokenIntrospectionRequestFormData = {
            "token": token,
            "client_id": CLIENT_ID,
        }

        # Get a list of key-value tuples and help the type checker see that every value
        # is guaranteed to be a string.
        request_form_data_kvs = [
            (k, v) for (k, v) in request_form_data.items() if isinstance(v, str)
        ]
        assert len(request_form_data_kvs) == len(request_form_data)

        raw_response = self._oauth2_backend.create_introspect_response(
            body_form_data=request_form_data_kvs,
            headers={},
        )

        if not 200 <= raw_response.status_code < 300:
            raise RuntimeError(
                f"Internal token introspection request failed."
                f" Status code: {raw_response.status_code}."
                f" Body: {repr(raw_response.body)}."
            )
        parsed_response = TokenIntrospectionResponse.model_validate_json(
            raw_response.body
        )
        return parsed_response
