"""Tests for the access control settings store."""

import pytest
import sqlalchemy

from robot_server.access_control.settings.models import RequestData, ResponseData
from robot_server.access_control.settings.store import AccessControlSettingStore

_ALL_FIELDS = list(ResponseData.model_fields.keys())


@pytest.fixture
def subject(
    sql_engine: sqlalchemy.engine.Engine,
) -> AccessControlSettingStore:
    """Return a test subject."""
    return AccessControlSettingStore(sql_engine=sql_engine)


def test_returns_defaults_when_nothing_set(subject: AccessControlSettingStore) -> None:
    """Verify get_all returns defaults when nothing set."""
    result = subject.get_all()
    assert result == ResponseData()


@pytest.mark.parametrize("field_name", _ALL_FIELDS)
def test_patch_field(subject: AccessControlSettingStore, field_name: str) -> None:
    """Verify patch sets the correct field."""
    result = subject.patch(RequestData.model_validate({field_name: True}))
    assert getattr(result, field_name) is True
    for other in _ALL_FIELDS:
        if other != field_name:
            assert getattr(result, other) is False


@pytest.mark.parametrize("field_name", _ALL_FIELDS)
def test_patch_null_reverts_to_default(
    subject: AccessControlSettingStore, field_name: str
) -> None:
    """Verify patch with null reverts to default."""
    subject.patch(RequestData.model_validate({field_name: True}))
    assert getattr(subject.get_all(), field_name) is True

    result = subject.patch(RequestData.model_validate({field_name: None}))
    assert getattr(result, field_name) is False


@pytest.mark.parametrize("field_name", _ALL_FIELDS)
def test_patch_overrides_previous_value(
    subject: AccessControlSettingStore, field_name: str
) -> None:
    """Verify patch overrides previous value."""
    subject.patch(RequestData.model_validate({field_name: True}))
    assert getattr(subject.get_all(), field_name) is True

    subject.patch(RequestData.model_validate({field_name: False}))
    assert getattr(subject.get_all(), field_name) is False


def test_patch_multiple_fields(subject: AccessControlSettingStore) -> None:
    """Verify patch with multiple fields updates the correct fields."""
    request = RequestData.model_validate(
        {
            "requireAdminCredsWhenUpdatingRobotSoftware": True,
            "requireSignoffForProtocolLog": True,
        }
    )
    result = subject.patch(request)
    assert result.requireAdminCredsWhenUpdatingRobotSoftware is True
    assert result.requireAdminCredsWhenSendingProtocolToRobot is False
    assert result.requireAdminCredsForSignoffProtocol is False
    assert result.requireSignoffForProtocolLog is True


def test_patch_empty_request_changes_nothing(
    subject: AccessControlSettingStore,
) -> None:
    """Verify patch with empty request changes nothing."""
    subject.patch(
        RequestData.model_validate({"requireAdminCredsWhenUpdatingRobotSoftware": True})
    )
    result = subject.patch(RequestData.model_validate({}))
    assert result.requireAdminCredsWhenUpdatingRobotSoftware is True


def test_reset_clears_all_settings(subject: AccessControlSettingStore) -> None:
    """Verify reset_all clears all access control settings."""
    subject.patch(RequestData.model_validate({name: True for name in _ALL_FIELDS}))
    subject.reset_all()
    assert subject.get_all() == ResponseData()


def test_reset_does_not_affect_other_boolean_settings(
    subject: AccessControlSettingStore,
    sql_engine: sqlalchemy.engine.Engine,
) -> None:
    """Verify reset_all only deletes access control keys, not other boolean settings."""
    from robot_server.persistence.tables import (
        BooleanSettingKey,
        boolean_setting_table,
    )

    with sql_engine.begin() as transaction:
        transaction.execute(
            sqlalchemy.insert(boolean_setting_table).values(
                key=BooleanSettingKey.ENABLE_ERROR_RECOVERY,
                value=False,
            )
        )

    subject.patch(
        RequestData.model_validate({"requireAdminCredsWhenUpdatingRobotSoftware": True})
    )
    subject.reset_all()

    with sql_engine.begin() as transaction:
        error_recovery_value = transaction.execute(
            sqlalchemy.select(boolean_setting_table.c.value).where(
                boolean_setting_table.c.key == BooleanSettingKey.ENABLE_ERROR_RECOVERY
            )
        ).scalar_one_or_none()
    assert error_recovery_value is not None, (
        "reset_all() should not delete non-access-control settings"
    )
