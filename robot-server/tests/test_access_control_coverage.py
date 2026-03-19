# noqa: D100

from __future__ import annotations

import pytest
from pydantic import BaseModel

from robot_server.app_setup import app

# Endpoints that are deliberately missing access control for some reason.
IGNORED_ENDPOINTS: set[tuple[str, str]] = {
    # /clientData is purely client-to-client communication, not actual robot control.
    ("post", "/clientData"),
    ("put", "/clientData"),
    ("delete", "/clientData"),
    ("put", "/clientData/{key}"),
    ("delete", "/clientData/{key}"),
    # This is spiritually a GET endpoint. It doesn't actually control or modify anything.
    ("post", "/labwareOffsets/searches"),
    # Protocol analyses are just disposable simulations.
    ("post", "/protocols/{protocolId}/analyses"),
}


# We assume these HTTP methods will never modify anything or control the robot,
# and thus probably do not need access control.
IGNORED_METHODS: set[str] = {"get"}


def test_access_control_coverage() -> None:
    """Look for endpoints that should have access control but don't.

    This is based on the information that our endpoints "publicly declare", so it can't
    find problems where access control exists but isn't implemented correctly. It only
    finds problems where we outright forgot to add access control.
    """
    openapi = _OpenAPI.model_validate(app.openapi())

    # Tuples of (method, path, has_access_control), e.g. ("get", "/foo", True).
    endpoint_info: list[tuple[str, str, bool]] = [
        (method, path, _endpoint_has_access_control(operation))
        for path, path_item in openapi.paths.items()
        for method, operation in path_item.items()
    ]

    # Sanity check to make sure the extraction worked.
    assert len(endpoint_info) > 0

    bad_endpoints = [
        (method, path)
        for method, path, has_security in endpoint_info
        if not has_security
        and method not in IGNORED_METHODS
        and (method, path) not in IGNORED_ENDPOINTS
    ]

    bad_endpoints.sort(
        key=lambda method_and_path: (method_and_path[1], method_and_path[0])
    )

    if bad_endpoints:
        endpoint_lines = "\n".join(
            f"* {method} {path}" for method, path in bad_endpoints
        )
        message = (
            f"HTTP endpoints are missing access control."
            f"\n\n"
            f"The following endpoints appear to be controlling or changing something"
            f" on the robot, based on their HTTP methods (PUT/POST/PATCH)."
            f" But, they do not appear to be protected behind any access control."
            f"\n\n"
            f"If an endpoint needs access control, add `require_scopes()` to it."
            f"\n\n"
            f"If an endpoint does not need access control, exclude it from this check."
            f" Add it to IGNORED_ENDPOINTS in {__name__}."
            f"\n\n"
            f"{endpoint_lines}"
        )
        pytest.fail(message)


def _endpoint_has_access_control(operation: _Operation) -> bool:
    # Interpreting the nested structure inside `security` is a bit complicated
    # because some levels are ORed together and some levels are ANDed together.
    # For our purposes, it suffices to check that there's at least one security scheme
    # with a non-empty list of scopes.
    for security_requirement in operation.security or []:
        for scope_list in security_requirement.values():
            if scope_list:
                return True
    return False


class _OpenAPI(BaseModel):
    """A barebones model for parsing an OpenAPI spec, just enough for our purposes.

    FastAPI provides more complete models, but they seem buggy. e.g. there are nested
    objects that the type checker thinks should be Pydantic models but are actually
    dicts at run time.

    Example:
    ```
    {
      "paths": {
        "/foo": {
          "get": {...}
          "post": {...}
        },
        "/bar": {
          "patch": {...}
        }
      }
    }
    ```
    """

    paths: dict[str, dict[str, _Operation]]


class _Operation(BaseModel):
    """Details describing a single operation, for example the details of `GET /health`.

    Example:
    ```
    {
      "security": [
        {
          "securitySchemeA": ["scope1", "scope2"],
          "securitySchemeB": ["scope3", "scope4"]
        },
        {
          "securitySchemeC": ["scope5", "scope6"],
          "securitySchemeD": ["scope7", "scope8"]
        }
      ]
    }
    ```
    """

    security: list[dict[str, list[str]]] | None = None
