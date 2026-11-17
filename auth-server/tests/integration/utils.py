"""Helper functions for use inside Tavern tests.

https://tavern.readthedocs.io/en/latest/basics.html#calling-external-functions
"""

import datetime
from pathlib import Path

from requests import Response
from sqlalchemy import create_engine, update

from server_utils import sql_utils
from server_utils.auth.scopes import parse_scopes

from auth_server.persistence.orm_models import User


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


def backdate_password_set_at(
    response: Response,
    *,
    username: str,
    days: int,
    db_path: str,
) -> None:
    """Move a user's password_set_at into the past so expiration can be tested."""
    engine = create_engine(sql_utils.get_connection_url(Path(db_path)))
    try:
        with engine.begin() as connection:
            result = connection.execute(
                update(User)
                .where(User.username == username)
                .values(
                    password_set_at=datetime.datetime.now(tz=datetime.UTC)
                    - datetime.timedelta(days=days)
                )
            )
            assert result.rowcount == 1, f"User {username!r} was not updated"
    finally:
        engine.dispose()
