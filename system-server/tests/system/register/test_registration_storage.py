from system_server.jwt import Registrant
import sqlalchemy

from system_server.system.register.storage import (
    get_or_create_registration_token,
)

from system_server.jwt import jwt_is_valid
from system_server import constants


async def test_get_or_create_token(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Test for the main interface for storage."""

    # First test a fresh database - we have no token!
    reg = Registrant("abc", "def", "ghi")
    key = "lime pie"

    first_token, first_is_new = get_or_create_registration_token(sql_engine, reg, key)
    assert first_is_new
    assert jwt_is_valid(key, first_token, constants.REGISTRATION_AUDIENCE)

    # Now test that, if the token is valid, we get the same one back
    assert (first_token, False) == get_or_create_registration_token(
        sql_engine, reg, key
    )


async def test_ovewrite_bad_token(sql_engine: sqlalchemy.engine.Engine) -> None:
    reg = Registrant("abc", "def", "ghi")
    key1 = "lime pie"
    key2 = "cherry pie"

    first_token, first_is_new = get_or_create_registration_token(sql_engine, reg, key1)

    assert first_is_new

    # Now test with the SAME AGENT, but a new key - the first key should fail validation!

    second_token, second_is_new = get_or_create_registration_token(
        sql_engine, reg, key2
    )
    assert second_is_new
    assert second_token != first_token
