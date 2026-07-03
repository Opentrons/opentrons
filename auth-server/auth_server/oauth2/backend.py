from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, NotRequired, TypedDict, TypeGuard, cast, override

import fastapi
import oauthlib.common
import oauthlib.oauth2
import pydantic

from server_utils.auth.scopes import Scope, UnrecognizedScopeError, serialize_scopes

from auth_server.persistence.orm_models import User as ORMUser
from auth_server.settings.store import SettingsStore
from auth_server.users.is_account_locked import is_account_locked
from auth_server.users.store import UserStore
from auth_server.users.user_data_manager import get_scope_set_of_user, password_hash

_log = logging.getLogger(__name__)

# oauthlib seems to expect every request to carry a client_id, even though OAuth 2
# doesn't require it for password grants. To work around this, we expect
# our clients to always supply this hard-coded arbitrary client_id.
#
# Possibly related oauthlib bugs:
# https://github.com/oauthlib/oauthlib/issues/389
# https://github.com/oauthlib/oauthlib/issues/641
_CLIENT_ID = "opentrons_app"


class Backend:
    """A backend that our server can use to process OAuth 2 requests."""

    def __init__(self, user_store: UserStore, settings_store: SettingsStore) -> None:
        def get_token_expires_in(request: oauthlib.common.Request) -> int:
            idle_logout_setting = settings_store.get_settings().idleLogout
            return int(idle_logout_setting)

        # "Legacy" refers to the fact that it uses the "resource owner password credentials"
        # grant type.
        self._inner_backend = oauthlib.oauth2.LegacyApplicationServer(
            _RequestValidator(_TokenStore(), user_store, settings_store),
            token_expires_in=get_token_expires_in,
        )

    def create_token_response(
        self, body_form_data: list[tuple[str, str]], headers: dict[str, str]
    ) -> fastapi.Response:
        """Process a request to the OAuth 2 token endpoint and return the response.

        This is basically a type-safe wrapper around the underlying oauthlib implementation.
        """
        token_response: tuple[dict[str, str], str, int] = (
            self._inner_backend.create_token_response(
                # The uri param apparently does not matter.
                uri="",
                # We can assume the request was POST because the FastAPI layer will enforce it.
                http_method="POST",
                body=body_form_data,
                headers=headers,
            )
        )
        headers, body, status_code = token_response
        return fastapi.Response(
            headers=headers,
            content=body,
            status_code=status_code,
        )

    def create_introspect_response(
        self, body_form_data: list[tuple[str, str]], headers: dict[str, str]
    ) -> fastapi.Response:
        """Process a request to the OAuth 2 introspection endpoint and return the response.

        This is basically a type-safe wrapper around the underlying oauthlib implementation.
        """
        headers, body, status_code = self._inner_backend.create_introspect_response(
            # The uri param apparently does not matter.
            uri="",
            # We can assume the request was POST because the FastAPI layer will enforce it.
            http_method="POST",
            # The type stubs are wrong; `body` can in fact be a `list[tuple[str, str]]`.
            body=body_form_data,  # type: ignore[arg-type]
            headers=headers,
        )
        return fastapi.Response(
            headers=headers,
            content=body,
            status_code=status_code,
        )


@dataclass
class _Client:
    """An object representing an OAuth 2 client, with the interface expected by oauthlib.

    This is documented in `oathlib.oauth2.RequestValidator.authenticate_client()`.
    """

    client_id: str


class _SaveBearerTokenInput(TypedDict):
    access_token: str
    refresh_token: NotRequired[str]
    expires_in: int


_validate_call_config: pydantic.ConfigDict = {
    "strict": True,
    "arbitrary_types_allowed": True,
}


class _RequestValidator(oauthlib.oauth2.RequestValidator):
    """Our main bindings to oauthlib.

    oauthlib calls these methods internally. We implement them with our customizations
    for storage and validation.

    oauthlib has poor support for type checking, even with the stubs from Typeshed.
    So we use `@pydantic.validate_call` liberally to protect ourselves from
    oauthlib calling us with argument types that we weren't expecting.
    """

    def __init__(
        self,
        token_store: _TokenStore,
        user_store: UserStore,
        settings_store: SettingsStore,
    ) -> None:
        self.__token_store = token_store
        self.__user_store = user_store
        self.__settings_store = settings_store
        super().__init__()

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def validate_client_id(
        self, client_id: str, request: oauthlib.common.Request
    ) -> bool:
        """Simple validity check: does the client exist? Not banned?"""
        return client_id == _CLIENT_ID

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def validate_scopes(  # type: ignore[override]
        self,
        client_id: str,
        scopes: list[str],
        # The type stubs think this `client` arg is an oauthlib.oauth2.Client, but that seems wrong.
        client: _Client,
        request: oauthlib.common.Request,
        *args: object,
        **kwargs: object,
    ) -> bool:
        """Is the client allowed to access the requested scopes?"""
        assert isinstance(request.user, ORMUser)
        user: ORMUser = request.user

        try:
            for scope in scopes:
                Scope.from_api_name(scope)
        except UnrecognizedScopeError:
            unrecognized_scope = True
        else:
            unrecognized_scope = False

        if unrecognized_scope:
            return False

        requested_scopes = set(scopes)
        return requested_scopes.issubset(
            s.api_name for s in get_scope_set_of_user(user)
        )

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def get_default_scopes(
        self, client_id: str, request: oauthlib.common.Request
    ) -> list[str]:
        """Scopes that we'll authorize a client for, if it doesn't ask for any explicitly."""
        assert isinstance(request.user, ORMUser)
        user: ORMUser = request.user
        return sorted(s.api_name for s in get_scope_set_of_user(user))

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def client_authentication_required(self, request: oauthlib.common.Request) -> bool:
        """Did the client provide authentication information (e.g. HTTP basic auth) that needs to be validated?"""
        return False

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def authenticate_client_id(
        self, client_id: str | None, request: oauthlib.common.Request
    ) -> bool:
        """Return whether the given client_id refers to an existing public (non-confidential) client."""
        if client_id == _CLIENT_ID:
            # The docs say setting `.client` here is optional,
            # but it seems to cause internal errors if we don't.
            request.client = _Client(client_id=client_id)  # type: ignore[attr-defined]
            return True
        else:
            return False

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def validate_user(  # type: ignore[override]
        self,
        username: str,
        password: str,
        # The type stubs think this `client` arg is an oauthlib.oauth2.Client, but that seems wrong.
        client: _Client,
        request: oauthlib.common.Request,
        *args: object,
        **kwargs: object,
    ) -> bool:
        """Check if some user credentials are valid to log in, and if so, return that user."""
        user = self.__user_store.get(username)
        max_login_attempts = (
            self.__settings_store.get_settings().maxNumberOfLoginAttempts
        )
        now = datetime.now(UTC)

        if user is None:
            # Unrecognized username.
            raise _CustomInvalidCredentialsError(login_attempts_remaining=None)

        password_is_correct = password_hash.verify(password, user.hashed_password)

        failed_login_count: int
        if password_is_correct:
            failed_login_count = self.__user_store.get_failed_login_count(username)
        else:
            # todo(mm, 2026-04-01): To prevent this list from growing unbounded,
            # we should hold ourselves to some reasonable upper limit (like say 100),
            # and limit the range of the admin-tunable setting to match.
            failed_login_count = self.__user_store.record_failed_login(username, now)

        is_currently_locked, attempts_remaining = is_account_locked(
            failed_login_count=failed_login_count,
            max_attempts=max_login_attempts,
        )

        if is_currently_locked or not password_is_correct:
            raise _CustomInvalidCredentialsError(attempts_remaining)

        # If the credentials pass the gauntlet above, it's a successful login.
        self.__user_store.clear_failed_logins(username)
        request.user = user  # type: ignore[attr-defined]
        return True

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def validate_grant_type(  # type: ignore[override]
        self,
        client_id: str,
        grant_type: str,
        # The type stubs think this `client` arg is an oauthlib.oauth2.Client, but that seems wrong.
        client: _Client,
        request: oauthlib.common.Request,
        *args: object,
        **kwargs: object,
    ) -> bool:
        """Return whether the given grant type is allowed for the given client."""
        # This server only supports username+password grants.
        return grant_type in ("password", "refresh_token")

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def save_bearer_token(
        self,
        token: _SaveBearerTokenInput,
        request: oauthlib.common.Request,
        *args: object,
        **kwargs: object,
    ) -> None:
        """Store information about a bearer (access) token that we're issuing."""
        access_token = token["access_token"]
        refresh_token = token.get("refresh_token", None)

        # This cast is because request.scopes is apparently mis-typed as a str; it's actually a list[str].
        scopes = cast(Any, request.scopes)
        assert _is_list_of_type(scopes, str)
        scopes = {Scope.from_api_name(s) for s in scopes}

        expires_in = token["expires_in"]

        user = request.user
        assert isinstance(user, ORMUser)

        client_id = request.client_id
        assert isinstance(client_id, str)

        now = _now()
        expires_at = now + timedelta(seconds=expires_in)
        self.__token_store.prune_inactive(now)
        self.__token_store.save(
            _TokenIssuance(
                client_id=client_id,
                username=user.username,
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=expires_at,
                scopes=scopes,
            )
        )

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def validate_refresh_token(  # type: ignore[override]
        self,
        refresh_token: str,
        # The type stubs think this `client` arg is an oauthlib.oauth2.Client, but that seems wrong.
        client: _Client,
        request: oauthlib.common.Request,
        *args: object,
        **kwargs: object,
    ) -> bool:
        """Check if a refresh token is valid."""
        issuance = self.__token_store.find_active_refresh_token(
            refresh_token, now=_now()
        )
        if issuance is not None:
            user = self.__user_store.get(issuance.username)
            if user is None:
                return False
            # Set `.user` per the oauthlib docs.
            request.user = user  # type: ignore[attr-defined]
            return True
        else:
            return False

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def get_original_scopes(
        self, refresh_token: str, request: oauthlib.common.Request
    ) -> list[str]:
        """Return the scopes that a refresh token was originally associated with.

        These will be passed on to the refreshed access token if the client did not
        specify a scope during the request.
        """
        token = self.__token_store.find_active_refresh_token(refresh_token, now=_now())
        assert token is not None
        return sorted(s.api_name for s in token.scopes)

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def introspect_token(
        self,
        token: str,
        token_type_hint: str | None,
        request: oauthlib.common.Request,
    ) -> dict[str, int | str | list[str]] | None:
        """Return information about an access or refresh token (if it exists)."""
        # Note: It's important that we return non-None only when the token is both
        # (1) currently active, and (2) an access token, as opposed to a refresh token.
        # oauthlib sets `"active": True` on any non-None response, and our resource
        # servers interpret that as meaning "this is a currently valid access token".
        found_access_token = self.__token_store.find_active_access_token(
            token, now=_now()
        )
        if found_access_token is None:
            return None
        else:
            # Values defined by:
            # https://datatracker.ietf.org/doc/html/rfc7662#section-2.2
            return {
                "scope": serialize_scopes(found_access_token.scopes),
                "username": found_access_token.username,
                # "active": True is set implicitly by oauthlib.
            }


class _CustomInvalidCredentialsError(oauthlib.oauth2.InvalidGrantError):
    """An "invalid credentials" error to return to the client, with some extra custom information.

    oauthlib doesn't exactly document that we're allowed to customize error responses
    this way, but you gotta do what you gotta do.
    """

    def __init__(self, login_attempts_remaining: int | None) -> None:
        """Construct the error.

        Params:
            login_attempts_remaining: How many login attempts the user has left
                before their account is locked, or `None` to omit that information.
        """
        self.__login_attempts_remaining = login_attempts_remaining
        super().__init__(
            description="Invalid credentials given.",  # Match oauthlib's default description.
            uri=None,
            state=None,
            status_code=None,
            request=None,
        )

    @property
    @override
    def json(self) -> str:
        """Override oauthlib's JSON serialization to add our customizations."""
        result = json.loads(super().json)
        if self.__login_attempts_remaining is not None:
            result["opentrons_login_attempts_remaining"] = (
                self.__login_attempts_remaining
            )
        return json.dumps(result)


@dataclass
class _TokenIssuance:
    """Information about an access token that we've issued."""

    client_id: str
    username: str
    access_token: str
    refresh_token: str | None
    # todo(mm, 2026-01-29): We might want expires_at to be a CLOCK_BOOTTIME value or something
    # to resist problems from clock adjustment.
    expires_at: datetime
    scopes: set[Scope]


class _TokenStore:
    def __init__(self) -> None:
        self._tokens: list[_TokenIssuance] = []

    def save(self, token: _TokenIssuance) -> None:
        self._tokens.append(token)

    def prune_inactive(self, now: datetime) -> None:
        self._tokens = [t for t in self._tokens if self._is_active(t, now)]

    def find_active_access_token(
        self, access_token: str, now: datetime
    ) -> _TokenIssuance | None:
        for token in self._tokens:
            if self._is_active(token, now) and token.access_token == access_token:
                return token
        return None

    def find_active_refresh_token(
        self, refresh_token: str, now: datetime
    ) -> _TokenIssuance | None:
        for token in self._tokens:
            if self._is_active(token, now) and token.refresh_token == refresh_token:
                return token
        return None

    @staticmethod
    def _is_active(token: _TokenIssuance, now: datetime) -> bool:
        return token.expires_at > now


def _is_list_of_type[ElementT](
    alleged_list: object, expected_element_type: type[ElementT]
) -> TypeGuard[list[ElementT]]:
    if not isinstance(alleged_list, list):
        return False
    return all(
        isinstance(element, expected_element_type)
        for element in cast(list[object], alleged_list)
    )


def _now() -> datetime:
    return datetime.now(tz=UTC)
