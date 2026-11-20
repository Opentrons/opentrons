"""Tests for persisted log level settings."""

import pytest
import sqlalchemy
from decoy import Decoy
from sqlalchemy.engine import Engine as SQLEngine

from system_server.logs import journald
from system_server.logs.models import LogLevels
from system_server.logs.settings import (
    apply_persisted_log_level,
    get_log_level_setting,
    set_log_level_setting,
)
from system_server.persistence.tables import SettingKey, settings_table


def test_get_log_level_setting(sql_engine: SQLEngine) -> None:
    """It should read the seeded log level from the database."""
    assert get_log_level_setting(sql_engine) == LogLevels.warning


def test_set_log_level_setting(sql_engine: SQLEngine) -> None:
    """It should persist the log level in the database."""
    set_log_level_setting(sql_engine, LogLevels.debug)

    assert get_log_level_setting(sql_engine) == LogLevels.debug
    with sql_engine.begin() as connection:
        value = connection.execute(
            sqlalchemy.select(settings_table.c.value).where(
                settings_table.c.key == SettingKey.LOG_LEVEL
            )
        ).scalar_one()
    assert value == "debug"


def test_apply_persisted_log_level(
    sql_engine: SQLEngine, decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """It should write the persisted log level to journald."""
    mock_set = decoy.mock(func=journald.set_max_level_store)
    monkeypatch.setattr(journald, "set_max_level_store", mock_set)

    with sql_engine.begin() as connection:
        connection.execute(
            sqlalchemy.update(settings_table)
            .where(settings_table.c.key == SettingKey.LOG_LEVEL)
            .values(value="error")
        )

    decoy.when(mock_set(LogLevels.error)).then_return("err")

    apply_persisted_log_level(sql_engine)
