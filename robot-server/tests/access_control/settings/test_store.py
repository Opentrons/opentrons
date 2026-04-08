"""Tests for the access control settings store."""

import pytest
import sqlalchemy

from robot_server.access_control.settings.models import RequestData, ResponseData
from robot_server.access_control.settings.store import (
    _DB_KEY_TO_FIELD_NAME,
    _FIELD_NAME_TO_DB_KEY,
    AccessControlSettingStore,
)

_ALL_FIELDS = list(ResponseData.model_fields.keys())
_DEFAULTS = ResponseData().model_validate({})


@pytest.fixture
def subject(
    sql_engine: sqlalchemy.engine.Engine,
) -> AccessControlSettingStore:
    """Return a test subject."""
    return AccessControlSettingStore(sql_engine=sql_engine)


def test_returns_defaults_when_nothing_set(subject: AccessControlSettingStore) -> None:
    """Verify get_all returns defaults when nothing set."""
    result = subject.get_all()
    assert result == _DEFAULTS


@pytest.mark.parametrize("field_name", _ALL_FIELDS)
def test_patch_field(subject: AccessControlSettingStore, field_name: str) -> None:
    """Verify patch changes a single field away from its default."""
    default_value = getattr(_DEFAULTS, field_name)
    new_value = not default_value
    result = subject.patch(RequestData.model_validate({field_name: new_value}))
    assert getattr(result, field_name) is new_value
    for other in _ALL_FIELDS:
        if other != field_name:
            assert getattr(result, other) == getattr(_DEFAULTS, other)


@pytest.mark.parametrize("field_name", _ALL_FIELDS)
def test_patch_null_reverts_to_default(
    subject: AccessControlSettingStore, field_name: str
) -> None:
    """Verify patch with null reverts to default."""
    default_value = getattr(_DEFAULTS, field_name)
    subject.patch(RequestData.model_validate({field_name: not default_value}))
    assert getattr(subject.get_all(), field_name) is (not default_value)

    result = subject.patch(RequestData.model_validate({field_name: None}))
    assert getattr(result, field_name) is default_value


@pytest.mark.parametrize("field_name", _ALL_FIELDS)
def test_patch_overrides_previous_value(
    subject: AccessControlSettingStore, field_name: str
) -> None:
    """Verify patch overrides previous value."""
    default_value = getattr(_DEFAULTS, field_name)
    subject.patch(RequestData.model_validate({field_name: not default_value}))
    assert getattr(subject.get_all(), field_name) is (not default_value)

    subject.patch(RequestData.model_validate({field_name: default_value}))
    assert getattr(subject.get_all(), field_name) is default_value


def test_patch_multiple_fields(subject: AccessControlSettingStore) -> None:
    """Verify patch with multiple fields updates the correct fields."""
    request = RequestData.model_validate(
        {
            "requireSignoffForProtocolLog": False,
            "requireLogsToBeSavedInApp": False,
            "deleteOverMaxOnDiskProtocols": True,
        }
    )
    result = subject.patch(request)
    assert result.requireSignoffForProtocolLog is False
    assert result.requireLogsToBeSavedInApp is False
    assert result.deleteOverMaxOnDiskProtocols is True


def test_patch_empty_request_changes_nothing(
    subject: AccessControlSettingStore,
) -> None:
    """Verify patch with empty request changes nothing."""
    subject.patch(RequestData.model_validate({"requireSignoffForProtocolLog": False}))
    result = subject.patch(RequestData.model_validate({}))
    assert result.requireSignoffForProtocolLog is False
    assert result.requireLogsToBeSavedInApp is True
    assert result.deleteOverMaxOnDiskProtocols is True


def test_reset_clears_all_settings(subject: AccessControlSettingStore) -> None:
    """Verify reset_all reverts all settings to defaults."""
    subject.patch(
        RequestData.model_validate(
            {name: not getattr(_DEFAULTS, name) for name in _ALL_FIELDS}
        )
    )
    subject.reset_all()
    assert subject.get_all() == _DEFAULTS


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

    subject.patch(RequestData.model_validate({"requireSignoffForProtocolLog": True}))
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


def test_mapping_covers_all_model_fields() -> None:
    """Verify every ResponseData field has a corresponding DB key mapping."""
    model_fields = set(ResponseData.model_fields.keys())
    mapped_fields = set(_DB_KEY_TO_FIELD_NAME.values())
    assert mapped_fields == model_fields


def test_mapping_is_bidirectional() -> None:
    """Verify the forward and reverse mappings are consistent."""
    for key, field_name in _DB_KEY_TO_FIELD_NAME.items():
        assert _FIELD_NAME_TO_DB_KEY[field_name] is key
