"""Unit tests for the audit-server settings store."""

from __future__ import annotations

import pytest
from sqlalchemy import select
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session

from audit_server.persistence.orm_models import Setting
from audit_server.settings.models import (
    PatchLoggingEnabledRequestData,
    PatchSettingsRequestData,
    SettingsResponseData,
)
from audit_server.settings.store import SettingsStore


@pytest.fixture
def settings_store(db_engine: SQLEngine) -> SettingsStore:
    """A SettingsStore backed by the fresh test database."""
    return SettingsStore(sql_engine=db_engine)


def test_logging_enabled_defaults_to_false(settings_store: SettingsStore) -> None:
    """Before it's ever set, loggingEnabled reads as False."""
    fetched = settings_store.get_logging_enabled_settings()
    assert fetched.loggingEnabled is False


def test_patch_logging_enabled_enables_and_persists(
    settings_store: SettingsStore,
) -> None:
    """Patching loggingEnabled to True is reflected and persisted."""
    returned = settings_store.patch_logging_enabled(
        PatchLoggingEnabledRequestData(loggingEnabled=True)
    )
    assert returned.loggingEnabled is True
    assert settings_store.get_logging_enabled_settings().loggingEnabled is True


def test_patch_logging_enabled_is_toggleable_both_ways(
    settings_store: SettingsStore,
) -> None:
    """Unlike auth-server access control, loggingEnabled can be turned back off."""
    returned_set = settings_store.patch_logging_enabled(
        PatchLoggingEnabledRequestData(loggingEnabled=True)
    )
    assert returned_set.loggingEnabled is True
    assert settings_store.get_logging_enabled_settings().loggingEnabled is True
    returned = settings_store.patch_logging_enabled(
        PatchLoggingEnabledRequestData(loggingEnabled=False)
    )
    assert returned.loggingEnabled is False
    assert settings_store.get_logging_enabled_settings().loggingEnabled is False


def test_get_settings_returns_defaults_when_empty(
    settings_store: SettingsStore,
) -> None:
    """With nothing stored, generic settings read as their defaults."""
    assert settings_store.get_settings() == SettingsResponseData()


def test_patch_settings_with_empty_body_is_noop(
    settings_store: SettingsStore,
) -> None:
    """Patching with no fields leaves the generic settings at their defaults.

    There are currently no generic settings, so an empty patch is the only
    possible patch; it should round-trip cleanly.
    """
    returned = settings_store.patch_settings(PatchSettingsRequestData())
    assert returned == SettingsResponseData()


def test_reset_settings_clears_generic_table(
    settings_store: SettingsStore,
    db_engine: SQLEngine,
) -> None:
    """reset_settings deletes all rows from the generic settings table.

    Since there are no generic settings fields yet, we seed the table directly
    to prove the generic table is wired up and that reset clears it.
    """
    with Session(db_engine) as session:
        session.add(Setting(key="someFutureSetting", value=123))
        session.commit()

    assert settings_store.reset_settings() == SettingsResponseData()

    with Session(db_engine) as session:
        remaining = session.scalars(select(Setting)).all()
    assert remaining == []
