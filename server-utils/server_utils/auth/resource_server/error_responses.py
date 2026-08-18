"""HTTP responses for authorization failures.

This module should be framework-agnostic, not tied to FastAPI or whatever.
"""

from typing import Annotated, TypeAlias

import fastapi
from pydantic import BaseModel, Field

from .types import (
    AdminCredentialsRequiredResult,
    InsufficientScopeResult,
    MissingTokenResult,
    NotAnActiveTokenResult,
    UnableToContactAuthServerResult,
)
from server_utils.auth.scopes import Scope

AuthorizationFailure: TypeAlias = (
    MissingTokenResult
    | NotAnActiveTokenResult
    | InsufficientScopeResult
    | AdminCredentialsRequiredResult
    | UnableToContactAuthServerResult
)


# todo(mm, 2026-02-10): Follow the server's existing error response conventions,
# such as returning an error code.
#
# Note: The shape of this response body is just an Opentrons API design decision.
# The specs only care about response headers and status codes.
class AuthorizationErrorResponse(BaseModel):
    """Returned when the client lacks authorization to access a protected resource."""

    debugMessage: Annotated[
        str,
        Field(
            description="A developer-readable debug message. Do not display to users."
        ),
    ]
    requiredScopes: Annotated[
        list[str],
        Field(
            description="The authorization scopes required to access the requested resource."
        ),
    ]
    providedScopes: Annotated[
        list[str],
        Field(description="The authorization scopes carried by the request."),
    ]
    adminCredentialsRequired: Annotated[
        bool,
        Field(
            description=(
                "If true, the token is valid and has the action's scopes, but a "
                "requireAdminCreds* setting currently restricts this action to admin "
                "or service accounts."
            )
        ),
    ] = False


def build_response_for_error(
    error: AuthorizationFailure,
    required_scopes: set[Scope],
) -> tuple[int, dict[str, str], AuthorizationErrorResponse]:
    """Turn the given authorization error into an HTTP response.

    The return value is a (status_code, headers, body) tuple.
    """
    required_scopes_str_list = sorted(scope.api_name for scope in required_scopes)
    headers = _build_response_headers_for_error(error)
    match error:
        case MissingTokenResult():
            return (
                fastapi.status.HTTP_401_UNAUTHORIZED,
                headers,
                AuthorizationErrorResponse(
                    debugMessage="The request is missing an access token.",
                    requiredScopes=required_scopes_str_list,
                    providedScopes=[],
                ),
            )
        case NotAnActiveTokenResult():
            return (
                fastapi.status.HTTP_401_UNAUTHORIZED,
                headers,
                AuthorizationErrorResponse(
                    debugMessage="The access token provided by the request is bogus or expired.",
                    requiredScopes=required_scopes_str_list,
                    providedScopes=[],
                ),
            )
        case InsufficientScopeResult(provided_scopes=provided_scopes):
            provided_scopes_str_list = sorted(
                scope.api_name for scope in provided_scopes
            )
            return (
                fastapi.status.HTTP_403_FORBIDDEN,
                headers,
                AuthorizationErrorResponse(
                    debugMessage="The access token provided by the request doesn't have all the scopes required for that resource.",
                    requiredScopes=required_scopes_str_list,
                    providedScopes=provided_scopes_str_list,
                ),
            )
        case AdminCredentialsRequiredResult():
            return (
                fastapi.status.HTTP_403_FORBIDDEN,
                headers,
                AuthorizationErrorResponse(
                    debugMessage="This action requires admin credentials.",
                    requiredScopes=required_scopes_str_list,
                    providedScopes=[],
                    adminCredentialsRequired=True,
                ),
            )
        case UnableToContactAuthServerResult():
            return (
                fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
                headers,
                AuthorizationErrorResponse(
                    debugMessage="The auth server cannot be contacted, so this endpoint is unavailable",
                    requiredScopes=[],
                    providedScopes=[],
                ),
            )


def _build_response_headers_for_error(
    error: AuthorizationFailure,
) -> dict[str, str]:
    """Return the headers that should be sent for an error response.

    This follows https://datatracker.ietf.org/doc/html/rfc6750#section-3.
    """
    match error:
        case MissingTokenResult():
            return {
                "WWW-Authenticate": _www_authenticate(
                    "Bearer",
                    {
                        # https://datatracker.ietf.org/doc/html/rfc6750#section-3.1
                        # says that we SHOULD NOT include this error code here,
                        # but section 3 says we MUST include at least one attribute, so....
                        #
                        # The alternatives would be to add a `scope` attribute
                        # (which has annoying charset rules) or some hard-coded global
                        # `realm` (which I generally understand less).
                        "error": "invalid_request"
                    },
                )
            }
        case NotAnActiveTokenResult():
            return {
                "WWW-Authenticate": _www_authenticate(
                    "Bearer", {"error": "invalid_token"}
                )
            }
        case InsufficientScopeResult():
            return {
                "WWW-Authenticate": _www_authenticate(
                    "Bearer", {"error": "insufficient_scope"}
                )
            }
        case AdminCredentialsRequiredResult():
            return {
                "WWW-Authenticate": _www_authenticate(
                    "Bearer", {"error": "insufficient_scope"}
                )
            }
        case UnableToContactAuthServerResult():
            return {}


def _www_authenticate(scheme: str, attributes: dict[str, str]) -> str:
    """Build a value for the WWW-Authenticate header (a "challenge").

    This is defined by https://datatracker.ietf.org/doc/html/rfc7235.
    """
    result = scheme
    if attributes:
        attribute_assignments = (
            f'{name}="{value}"' for name, value in attributes.items()
        )
        result += " " + " ".join(attribute_assignments)
    return result
