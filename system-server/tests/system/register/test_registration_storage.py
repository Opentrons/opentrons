from system_server.persistence import registration_table
from system_server.jwt import Registrant
import sqlalchemy
import pytest

from system_server.system.register.storage import (
    _get_registration_token,
    _add_registration_token,
    _delete_registration_token,
    get_or_create_registration_token,
)

from system_server.jwt import jwt_is_valid
from system_server import constants


async def test_registration_storage(sql_engine: sqlalchemy.engine.Engine) -> None:
    reg = Registrant("abc", "def", "ghi")
    token = "fake-token-to-store-in-my-database"

    assert _get_registration_token(sql_engine, reg) is None

    _add_registration_token(sql_engine, reg, token)

    assert _get_registration_token(sql_engine, reg) == token

    # Test duplicate insertions
    with pytest.raises(Exception):
        _add_registration_token(sql_engine, reg, "a second, different token")

    # Make sure the other token didn't get inserted
    assert _get_registration_token(sql_engine, reg) == token


async def test_multiple_registration_storage(
    sql_engine: sqlalchemy.engine.Engine,
) -> None:
    """Test that interacting with the engine only affects the specified rows."""
    registrants = [Registrant(f"sub{n}", "abc", "def") for n in range(100)]

    def token_from_registrant(reg: Registrant) -> str:
        return f"Token for {reg.subject} {reg.agent} {reg.agent_id}"

    # Register 100 registrants
    for reg in registrants:
        assert _get_registration_token(sql_engine, reg) is None
        _add_registration_token(sql_engine, reg, token_from_registrant(reg))

    # Now make sure EACH ONE can be looked up!
    for reg in registrants:
        assert _get_registration_token(sql_engine, reg) == token_from_registrant(reg)

    # Now delete one specific row and make sure everything else is ok
    while len(registrants) > 0:
        reg = registrants.pop(0)
        _delete_registration_token(sql_engine, reg)
        # To verify that the deletion worked, we check that:
        #   1. The specified token is gone
        #   2. The number of rows in the table went down by one
        assert _get_registration_token(sql_engine, reg) is None
        with sql_engine.begin() as conn:
            statement = sqlalchemy.select(registration_table)
            assert len(conn.execute(statement).all()) == len(registrants)


async def test_get_or_create_token(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Test for the main interface for storage."""

    # First test a fresh database - we have no token!
    reg = Registrant("abc", "def", "ghi")
    key = "lime pie"

    first_token = get_or_create_registration_token(sql_engine, reg, key)
    assert jwt_is_valid(key, first_token, constants.REGISTRATION_AUDIENCE)

    # Now test that, if the token is valid, we get the same one back
    assert first_token == get_or_create_registration_token(sql_engine, reg, key)

    reg.agent = "new agent"

    # Now insert an invalid token to the database and make sure it doesn't get returned
    bad_token = "this is not a valid token and it should clearly fail validation!"
    _add_registration_token(sql_engine, reg, bad_token)

    second_token = get_or_create_registration_token(sql_engine, reg, key)
    assert second_token != bad_token
