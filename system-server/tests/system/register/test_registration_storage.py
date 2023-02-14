from system_server.persistence import registration_table
from system_server.jwt import Registrant
import sqlalchemy
import pytest

from system_server.system.register.storage import (
    get_registration_token,
    add_registration_token,
    delete_registration_token,
)


async def test_registration_storage(sql_engine: sqlalchemy.engine.Engine) -> None:
    reg = Registrant("abc", "def", "ghi")
    token = "fake-token-to-store-in-my-database"

    assert get_registration_token(sql_engine, reg) is None

    add_registration_token(sql_engine, reg, token)

    assert get_registration_token(sql_engine, reg) == token

    # Test duplicate insertions
    with pytest.raises(Exception):
        add_registration_token(sql_engine, reg, "a second, different token")

    # Make sure the other token didn't get inserted
    assert get_registration_token(sql_engine, reg) == token


async def test_multiple_registration_storage(
    sql_engine: sqlalchemy.engine.Engine,
) -> None:
    """Test that interacting with the engine only affects the specified rows."""
    registrants = [Registrant(f"sub{n}", "abc", "def") for n in range(100)]

    def token_from_registrant(reg: Registrant) -> str:
        return f"Token for {reg.subject} {reg.agent} {reg.agent_id}"

    # Register 100 registrants
    for reg in registrants:
        assert get_registration_token(sql_engine, reg) is None
        add_registration_token(sql_engine, reg, token_from_registrant(reg))

    # Now make sure EACH ONE can be looked up!
    for reg in registrants:
        assert get_registration_token(sql_engine, reg) == token_from_registrant(reg)

    # Now delete one specific row and make sure everything else is ok
    while len(registrants) > 0:
        reg = registrants.pop(0)
        delete_registration_token(sql_engine, reg)
        # To verify that the deletion worked, we check that:
        #   1. The specified token is gone
        #   2. The number of rows in the table went down by one
        assert get_registration_token(sql_engine, reg) is None
        with sql_engine.begin() as conn:
            statement = sqlalchemy.select(registration_table)
            assert len(conn.execute(statement).all()) == len(registrants)
