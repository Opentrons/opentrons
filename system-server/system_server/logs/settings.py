"""Persisted log level settings."""

from __future__ import annotations

import logging

import sqlalchemy

from . import journald
from .models import LogLevels
from system_server.persistence.tables import SettingKey, settings_table

LOG = logging.getLogger(__name__)


def get_log_level_setting(sql_engine: sqlalchemy.engine.Engine) -> LogLevels:
    """Read the persisted local log level from the settings table."""
    with sql_engine.begin() as transaction:
        value: str | None = transaction.execute(
            sqlalchemy.select(settings_table.c.value).where(
                settings_table.c.key == SettingKey.LOG_LEVEL
            )
        ).scalar_one_or_none()

    if value is None:
        raise RuntimeError("log_level setting is missing from the database")

    # This `type: ignore[call-arg]` is because mypy thinks there needs to be
    # a second arg here for the int level, but there does not.
    return LogLevels(value.lower())  # type: ignore[call-arg]


def apply_persisted_log_level(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Apply the persisted log level to journald.

    Intended to run at server startup after database migration.
    """
    level = get_log_level_setting(sql_engine)
    LOG.info("Applying persisted log level %s to journald", level.value)
    journald.set_max_level_store(level)
