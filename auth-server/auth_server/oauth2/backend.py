from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, TypedDict, TypeGuard, cast, override

import fastapi
import oauthlib.common
import oauthlib.oauth2
import pydantic

from auth_server.users.scopes import Scope
from auth_server.users.store import TEST_USERS, User

router = fastapi.APIRouter(prefix="/auth")


_CLIENT_ID = "unregistered-client"


# todo(mm, 2026-01-30): There ought to be some HTTP endpoint to configure this.
_TOKEN_LIFETIME = timedelta(minutes=3)


@dataclass
class _Client:
    """An object representing an OAuth 2 client, with the interface expected by oauthlib.

    This is documented in `oathlib.oauth2.RequestValidator.authenticate_client()`.
    """

    client_id: str


class _SaveBearerTokenInput(TypedDict):
    access_token: str
    refresh_token: str
    expires_in: float


_validate_call_config: pydantic.ConfigDict = {
    "strict": True,
    "arbitrary_types_allowed": True,
}


def _now() -> datetime:
    return datetime.now(tz=UTC)


class RequestValidator(oauthlib.oauth2.RequestValidator):
    def __init__(self, token_store: _TokenStore) -> None:
        self.__token_store = token_store
        super().__init__()

    # Pre- and post-authorization.

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def validate_client_id(
        self, client_id: str, request: oauthlib.common.Request
    ) -> bool:
        """Simple validity check: does the client exist? Not banned?"""
        return client_id == _CLIENT_ID

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def validate_scopes(
        self,
        client_id: str,
        scopes: list[str],
        client: _Client,
        request: oauthlib.common.Request,
    ) -> bool:
        """Is the client allowed to access the requested scopes?"""
        assert isinstance(request.user, User)
        user: User = request.user

        requested_scopes = set(scopes)
        allowed_scopes = user.scopes
        return requested_scopes.issubset(allowed_scopes)

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def get_default_scopes(
        self, client_id: str, request: oauthlib.common.Request
    ) -> list[str]:
        """Scopes to authorize a client for, if it doesn't ask for any explicitly."""
        assert isinstance(request.user, User)
        user: User = request.user

        return sorted(user.scopes)

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def client_authentication_required(self, request: oauthlib.common.Request) -> bool:
        # Check if the client provided authentication information that needs to
        # be validated, e.g. HTTP Basic auth
        return False

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def authenticate_client_id(
        self, client_id: str | None, request: oauthlib.common.Request
    ) -> bool:
        """Despite the name, this should return whether the given client_id refers to an existing public (non-confidential) client."""
        if client_id == _CLIENT_ID:
            # Despite the docs, this DOES seem necessary.
            request.client = _Client(client_id=client_id)
            return True
        else:
            return False

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def validate_user(
        self,
        username: str,
        password: str,
        client: _Client,
        request: oauthlib.common.Request,
    ) -> bool:
        for user in TEST_USERS:
            if user.username == username and user.password == password:
                request.user = user
                return True
        return False

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def validate_grant_type(
        self,
        client_id: str,
        grant_type: str,
        client: _Client,
        request: oauthlib.common.Request,
    ) -> bool:
        """Return whether the given grant type is allowed for the given client."""
        # This server only supports username+password grants.
        return grant_type in ("password", "refresh_token")

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def save_bearer_token(
        self, token: _SaveBearerTokenInput, request: oauthlib.common.Request
    ) -> None:
        # TODO: See if we also have a path to save JWTs.
        access_token = token["access_token"]

        refresh_token = token["refresh_token"]

        # This cast is because request.scopes is apparently mis-typed as a str; it's actually a list[str].
        scopes = cast(Any, request.scopes)
        assert _is_list_of_type(scopes, str)
        scopes = [Scope(s) for s in scopes]

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
        self, token: str, scopes: list[str], request: oauthlib.common.Request
    ):
        issuance = self.__token_store.find_active_access_token(token, now=_now())
        if issuance is not None:
            # find_active_access_token() already checked the expiration for us,
            # so we just need to check scope membership.
            requested_scopes = set(scopes)
            issued_scopes = issuance.scopes
            return requested_scopes.issubset(issued_scopes)
        else:
            return False

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def validate_refresh_token(
        self, refresh_token: str, client: _Client, request: oauthlib.common.Request
    ) -> bool:
        issuance = self.__token_store.find_active_refresh_token(
            refresh_token, now=_now()
        )
        if issuance is not None:
            user = next(
                user for user in TEST_USERS if user.username == issuance.username
            )
            request.user = user  # Gross, but the docs say we need to store the user for later like this.
            return True
        else:
            return False

    # Token refresh request

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def rotate_refresh_token(self, request: oauthlib.common.Request) -> bool:
        return False

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def get_original_scopes(
        self, refresh_token: str, request: oauthlib.common.Request
    ) -> list[str]:
        # Obtain the token associated with the given refresh_token and
        # return its scopes, these will be passed on to the refreshed
        # access token if the client did not specify a scope during the
        # request.
        token = self.__token_store.find_active_refresh_token(refresh_token, now=_now())
        assert token is not None
        return sorted(token.scopes)

    @override
    @pydantic.validate_call(config=_validate_call_config)
    def introspect_token(
        self,
        token: str,
        token_type_hint: str | None,
        request: oauthlib.common.Request,
    ) -> dict[str, int | str | list[str]] | None:
        found_token = self.__token_store.find_active_access_token(
            token, now=_now()
        ) or self.__token_store.find_active_refresh_token(token, now=_now())
        if found_token:
            # Values defined by:
            # https://datatracker.ietf.org/doc/html/rfc7662#section-2.2
            return {
                "active": True,  # Always true because find_active_*_token() won't return inactive tokens.
                "scope": " ".join(sorted(found_token.scopes)),
                "username": found_token.username,
            }
        else:
            return None


@dataclass
class _TokenIssuance:
    # TODO: I might be storing this wrong, this might need to be type = access | refresh instead of storing both the access and refresh together.
    client_id: str
    username: str
    access_token: str
    refresh_token: str | None
    # todo(mm, 2026-01-29): We might want expires_at to be a CLOCK_BOOTTIME value or something
    # to resist problems from clock adjustment.
    expires_at: datetime
    scopes: list[Scope]


class _TokenStore:
    def __init__(self) -> None:
        self._tokens: list[_TokenIssuance] = []

    def save(self, token: _TokenIssuance) -> None:
        print("Saving", token)
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


validator = RequestValidator(_TokenStore())

# "Legacy" in this case refers to the fact that it uses the "resource owner password
# credentials" grant type, which is discouraged in web apps for reasons that we don't
# feel apply to us.
server = oauthlib.oauth2.LegacyApplicationServer(
    validator, token_expires_in=int(_TOKEN_LIFETIME.total_seconds())
)


def _is_list_of_type[ElementT](
    alleged_list: object, expected_element_type: type[ElementT]
) -> TypeGuard[list[ElementT]]:
    assert isinstance(alleged_list, list)
    return all(
        isinstance(element, expected_element_type)
        for element in cast(list[object], alleged_list)
    )
