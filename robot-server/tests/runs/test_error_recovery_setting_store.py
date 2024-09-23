"""Tests for error_recovery_setting_store."""


from robot_server.runs.error_recovery_setting_store import ErrorRecoverySettingStore

import pytest
import sqlalchemy


@pytest.fixture
def subject(
    sql_engine: sqlalchemy.engine.Engine,
) -> ErrorRecoverySettingStore:
    """Return a test subject."""
    return ErrorRecoverySettingStore(sql_engine=sql_engine)


def test_error_recovery_setting_store(subject: ErrorRecoverySettingStore) -> None:
    """Test `ErrorRecoverySettingStore`."""
    assert subject.get_is_enabled() is None

    subject.set_is_enabled(is_enabled=False)
    assert subject.get_is_enabled() is False

    subject.set_is_enabled(is_enabled=True)
    assert subject.get_is_enabled() is True
