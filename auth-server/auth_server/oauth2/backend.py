from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, NotRequired, TypeAlias, TypedDict, TypeGuard, cast, override

import oauthlib.common
import oauthlib.oauth2
import pydantic

from server_utils.auth.scopes import Scope, UnrecognizedScopeError, serialize_scopes

from auth_server.users.store import TEST_USERS, User

_log = logging.getLogger(__name__)

# oauthlib seems to expect every request to carry a client_id, even though OAuth 2
# doesn't require it for password grants. To work around this, we expect
# our clients to always supply this hard-coded arbitrary client_id.
#
# Possibly related oauthlib bugs:
# https://github.com/oauthlib/oauthlib/issues/389
# https://github.com/oauthlib/oauthlib/issues/641
_CLIENT_ID = "opentrons_app"

# todo(mm, 2026-01-30): There ought to be some HTTP endpoint to configure this.
_TOKEN_LIFETIME = timedelta(minutes=3)


Backend: TypeAlias = oauthlib.oauth2.LegacyApplicationServer
"""A backend that our server can use to process OAuth 2 requests.

"Legacy" in this case refers to the fact that it uses the "resource owner password
credentials" grant type.
"""


def build() -> Backend:
    """Return a backend that our server can use to process OAuth 2 requests."""
    return oauthlib.oauth2.LegacyApplicationServer(
        _RequestValidator(_TokenStore()),
        token_expires_in=int(_TOKEN_LIFETIME.total_seconds())
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

    oauthlib calls these methods internally. We implement them with

    oauthlib has poor support for type checking, even with the stubs from Typeshed.
    So we use `@pydantic.validate_call` liberally to protect ourselves from
    oauthlib calling us with argument types that we weren't expecting.
    """

    def __init__(self, token_store: _TokenStore) -> None:
        self.__token_store = token_store
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
        assert isinstance(request.user, User)
        user: User = request.user

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
        allowed_scopes = {scope.api_name for scope in user.scopes}
        return requested_scopes.issubset(allowed_scopes)

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def get_default_scopes(
        self, client_id: str, request: oauthlib.common.Request
    ) -> list[str]:
        """Scopes that we'll authorize a client for, if it doesn't ask for any explicitly."""
        assert isinstance(request.user, User)
        user: User = request.user
        return sorted(scope.api_name for scope in user.scopes)

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
        for user in TEST_USERS:
            if user.username == username and user.password == password:
                # Set `.user` per the oauthlib docs.
                request.user = user  # type: ignore[attr-defined]
                return True
        return False

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
        assert isinstance(user, User)

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
    def validate_bearer_token(
        self,
        # Despite the docs, token can apparently be None if this is called
        # through verify_request().
        token: str | None,
        scopes: list[str],
        request: oauthlib.common.Request,
    ) -> bool:
        """Check if a bearer (access) token is allowed to access the given scopes."""
        if token is None:
            _log.info("The request provided no bearer token.")
            return False

        issuance = self.__token_store.find_active_access_token(token, now=_now())
        if issuance is not None:
            # find_active_access_token() already checked the expiration for us,
            # so we just need to check scope membership.
            requested_scopes = set(scopes)
            issued_scopes = {scope.api_name for scope in issuance.scopes}
            if requested_scopes.issubset(issued_scopes):
                return True
            else:
                _log.info(
                    f"The request provided a bearer token with insufficient scopes."
                    f" Required: {requested_scopes}."
                    f" Provided: {issued_scopes}."
                )
                return False
        else:
            _log.info("The request provided an expired or nonexistent bearer token.")
            return False

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
            user = next(
                user for user in TEST_USERS if user.username == issuance.username
            )
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
        found_token = self.__token_store.find_active_access_token(
            token, now=_now()
        ) or self.__token_store.find_active_refresh_token(token, now=_now())
        if found_token:
            # Values defined by:
            # https://datatracker.ietf.org/doc/html/rfc7662#section-2.2
            return {
                "active": True,  # Always true because find_active_*_token() won't return inactive tokens.
                "scope": serialize_scopes(found_token.scopes),
                "username": found_token.username,
            }
        else:
            return None


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
    assert isinstance(alleged_list, list)
    return all(
        isinstance(element, expected_element_type)
        for element in cast(list[object], alleged_list)
    )


def _now() -> datetime:
    return datetime.now(tz=UTC)
