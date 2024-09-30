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
    assert subject.get_is_disabled() is None

    subject.set_is_disabled(is_disabled=False)
    assert subject.get_is_disabled() is False

    subject.set_is_disabled(is_disabled=True)
    assert subject.get_is_disabled() is True

    subject.set_is_disabled(is_disabled=None)
    assert subject.get_is_disabled() is None
