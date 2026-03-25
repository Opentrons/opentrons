# noqa: D100

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


def get_declared_security(openapi: dict[str, Any]) -> dict[tuple[str, str], bool]:
    """Return which endpoints in a server are protected with access control.

    Limitations:
        This is intended to help find basic omissions, like if we outright forgot to add
        access control to an endpoint. It can't check that the access control was
        actually implemented correctly. It works based on what the server says
        about itself in its OpenAPI document, which is not necessarily the truth.

    Params:
        openapi: The OpenAPI document to extract information from,
        e.g. as returned by `FastAPI.openapi()`.

    Returns:
        A dict where the keys are `(method, path)` tuples, and the values are whether
        that endpoint has any kind of security declared. For example,
        `{("get", "/health"): False}`.
    """
    validated_openapi = _OpenAPI.model_validate(openapi)
    return {
        (method, path): _operation_has_security(operation)
        for path, path_item in validated_openapi.paths.items()
        for method, operation in path_item.items()
    }


def _operation_has_security(operation: _Operation) -> bool:
    # Is there at least one security scheme that has a non-empty list of scopes?
    for security_requirement in operation.security or []:
        for scope_list in security_requirement.values():
            if scope_list:
                return True
    return False


class _OpenAPI(BaseModel):
    """A barebones model for parsing an OpenAPI document, just enough for our purposes.

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
