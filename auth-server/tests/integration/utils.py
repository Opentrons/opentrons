"""Helper functions for use inside Tavern tests.

https://tavern.readthedocs.io/en/latest/basics.html#calling-external-functions
"""

from requests import Response

from server_utils.auth.scopes import parse_scopes


def verify_oauth_scopes(
    response: Response,
    *,
    expected_present: str = "",
    expected_absent: str = "",
) -> None:
    """Verify that an OAuth response's scope field includes and excludes specific scopes.

    `expected_present` and `expected_absent` are space-separated scope API names
    (e.g. ``"updates.write protocols.write"``).
    """
    parsed_actual = parse_scopes(response.json().get("scope", ""))
    parsed_expected_present = parse_scopes(expected_present)
    parsed_expected_absent = parse_scopes(expected_absent)

    missing = parsed_expected_present - parsed_actual
    assert not missing, (
        "Expected scopes missing from response: "
        f"{sorted(scope.api_name for scope in missing)}"
    )

    unexpected = parsed_expected_absent & parsed_actual
    assert not unexpected, (
        "Unexpected scopes present in response: "
        f"{sorted(scope.api_name for scope in unexpected)}"
    )
