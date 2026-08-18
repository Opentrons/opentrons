"""Types and models for authn/authz."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, TypeAlias, TypedDict

import pydantic

from server_utils.auth.scopes import Scope


@dataclass
class AuthorizationNotRequiredResult:
    """Authorization was neither provided nor required--access control mode is disabled."""

    authentication: AuthenticationResult


@dataclass
class AuthenticationNotRequiredResult:
    """Authentication was neither provided nor required."""


@dataclass
class AuthorizedResult:
    """The request is authorized."""

    username: str
    fullname: str


@dataclass
class AuthenticatedResult:
    """The request is from an authenticated client."""

    scope: str
    username: str
    fullname: str
    account_type: str = ""
    """The account type from auth-server (`admin`, `user`, `auditor`, `service`)."""


@dataclass
class InsufficientScopeResult:
    """The provided access token is valid, but it isn't authorized with all the required scopes."""

    provided_scopes: set[Scope]
    """The scopes carried by the access token."""


@dataclass
class MissingTokenResult:
    """No access token was provided."""

    pass


@dataclass
class NotAnActiveTokenResult:
    """The provided access token is expired, or was never valid to begin with."""

    pass


@dataclass
class UnableToContactAuthServerResult:
    """The authorization server couldn't be contacted."""

    pass


@dataclass
class AdminCredentialsRequiredResult:
    """The token is valid, but this action currently requires an admin account."""

    pass


AuthenticationResult: TypeAlias = (
    MissingTokenResult
    | NotAnActiveTokenResult
    | UnableToContactAuthServerResult
    | AuthenticatedResult
    | AuthenticationNotRequiredResult
)

AuthorizationResult: TypeAlias = (
    MissingTokenResult
    | NotAnActiveTokenResult
    | UnableToContactAuthServerResult
    | InsufficientScopeResult
    | AuthorizationNotRequiredResult
    | AuthorizedResult
)


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class TokenIntrospectionResponse(_StrictBaseModel):
    """A response body from auth-server's token introspection endpoint.

    This is specified by https://datatracker.ietf.org/doc/html/rfc7662#section-2.2.
    """

    active: bool
    scope: str = ""
    username: str | None = None
    ot_fullname: str | None = None
    ot_account_type: str | None = None


class TokenIntrospectionRequestFormData(TypedDict):
    """Form data for a request to auth-server's token introspection endpoint.

    This is specified by https://datatracker.ietf.org/doc/html/rfc7662#section-2.1.
    """

    token: str

    client_id: ClientIDType


class AuthSettingsResponse(_StrictBaseModel):
    """A response body from auth-server's /settings endpoint."""

    data: AuthSettingsResponseData


class AuthSettingsResponseData(_StrictBaseModel):
    """Response body data from auth-server's /settings endpoint."""

    accessControlEnabled: bool


class AdminCredsSettingsData(pydantic.BaseModel):
    """The requireAdminCreds* flags from GET /auth/settings.

    Extra fields on that endpoint are ignored. Defaults match auth-server.
    """

    model_config = {"extra": "ignore"}

    requireAdminCredsWhenUpdatingRobotSoftware: bool = True
    requireAdminCredsWhenSendingProtocolToRobot: bool = True
    requireAdminCredsForSignoffProtocol: bool = False


class AdminCredsSettingsResponse(_StrictBaseModel):
    """A response body from auth-server's GET /auth/settings endpoint."""

    data: AdminCredsSettingsData


ClientIDType: TypeAlias = Literal["opentrons_app"]
