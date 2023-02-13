from system_server.jwt import Registrant
import sqlalchemy
import pytest

from system_server.system.register.storage import (
    get_registration_token,
    add_registration_token,
)


async def test_registration_storage(sql_engine: sqlalchemy.engine.Engine) -> None:
    reg = Registrant("abc", "def", "ghi")
    token = "fake-token-to-store-in-my-database"

    assert await get_registration_token(sql_engine, reg) is None

    await add_registration_token(sql_engine, reg, token)

    assert await get_registration_token(sql_engine, reg) == token

    # Test duplicate insertions
    with pytest.raises(Exception):
        await add_registration_token(sql_engine, reg, "a second, different token")

    # Make sure the other token didn't get inserted
    assert await get_registration_token(sql_engine, reg) == token
