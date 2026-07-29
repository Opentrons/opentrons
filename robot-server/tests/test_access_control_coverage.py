# noqa: D100

from __future__ import annotations

import pytest

from server_utils.testing_utils.get_declared_security import get_declared_security

from robot_server.app_setup import app

# Endpoints that are deliberately missing access control for some reason.
IGNORED_ENDPOINTS: set[tuple[str, str]] = {
    # /clientData is purely client-to-client communication, not actual robot control.
    ("put", "/clientData"),
    ("delete", "/clientData"),
    ("put", "/clientData/{key}"),
    ("delete", "/clientData/{key}"),
    # This is spiritually a GET endpoint. It doesn't actually control or modify anything.
    ("post", "/labwareOffsets/searches"),
}


# We assume these HTTP methods will never modify anything or control the robot,
# and thus probably do not need access control.
IGNORED_METHODS: set[str] = {"get"}


def test_access_control_coverage() -> None:
    """Look for endpoints that should have access control but don't."""
    endpoint_info = get_declared_security(app.openapi())

    # Sanity check to make sure the extraction worked.
    assert endpoint_info

    bad_endpoints = [
        (method, path)
        for (method, path), has_security in endpoint_info.items()
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
            f"Based on the HTTP API that this server is publicly declaring,"
            f" these endpoints appear to be controlling or changing something on the robot,"
            f" but they do not appear to be protected behind any access control."
            f"\n\n"
            f"If an endpoint needs access control, add `require_scopes()` to it."
            f"\n\n"
            f"If an endpoint does not need access control, exclude it from this check."
            f" Edit {__file__}."
            f"\n\n"
            f"{endpoint_lines}"
        )
        pytest.fail(message)
