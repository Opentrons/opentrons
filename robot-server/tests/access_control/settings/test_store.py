"""Tests for the access control settings store."""

import pytest
import sqlalchemy

from robot_server.access_control.settings.models import RequestData, ResponseData
from robot_server.access_control.settings.store import AccessControlSettingStore


@pytest.fixture
def subject(
    sql_engine: sqlalchemy.engine.Engine,
) -> AccessControlSettingStore:
    """Return a test subject."""
    return AccessControlSettingStore(sql_engine=sql_engine)


def test_returns_defaults_when_nothing_set(subject: AccessControlSettingStore) -> None:
    result = subject.get_all()
    assert result == ResponseData()


def test_patch_single_field(subject: AccessControlSettingStore) -> None:
    request = RequestData.model_validate(
        {"requireAdminCredsWhenUpdatingRobotSoftware": True}
    )
    result = subject.patch(request)
    assert result.requireAdminCredsWhenUpdatingRobotSoftware is True
    assert result.requireAdminCredsWhenSendingProtocolToRobot is False


def test_patch_multiple_fields(subject: AccessControlSettingStore) -> None:
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
    subject.patch(
        RequestData.model_validate({"requireAdminCredsWhenUpdatingRobotSoftware": True})
    )
    result = subject.patch(RequestData.model_validate({}))
    assert result.requireAdminCredsWhenUpdatingRobotSoftware is True


def test_patch_null_reverts_to_default(subject: AccessControlSettingStore) -> None:
    subject.patch(
        RequestData.model_validate({"requireAdminCredsWhenUpdatingRobotSoftware": True})
    )
    assert subject.get_all().requireAdminCredsWhenUpdatingRobotSoftware is True

    result = subject.patch(
        RequestData.model_validate({"requireAdminCredsWhenUpdatingRobotSoftware": None})
    )
    assert result.requireAdminCredsWhenUpdatingRobotSoftware is False


def test_patch_overrides_previous_value(
    subject: AccessControlSettingStore,
) -> None:
    subject.patch(
        RequestData.model_validate({"requireAdminCredsForSignoffProtocol": True})
    )
    assert subject.get_all().requireAdminCredsForSignoffProtocol is True

    subject.patch(
        RequestData.model_validate({"requireAdminCredsForSignoffProtocol": False})
    )
    assert subject.get_all().requireAdminCredsForSignoffProtocol is False


def test_patch_does_not_affect_unspecified_fields(
    subject: AccessControlSettingStore,
) -> None:
    subject.patch(
        RequestData.model_validate(
            {
                "requireAdminCredsWhenUpdatingRobotSoftware": True,
                "requireSignoffForProtocolLog": True,
            }
        )
    )
    subject.patch(
        RequestData.model_validate(
            {"requireAdminCredsWhenUpdatingRobotSoftware": False}
        )
    )
    result = subject.get_all()
    assert result.requireAdminCredsWhenUpdatingRobotSoftware is False
    assert result.requireSignoffForProtocolLog is True


class TestResetAll:
    """Tests for `reset_all()`."""

    def test_reset_clears_all_settings(
        self, subject: AccessControlSettingStore
    ) -> None:
        subject.patch(
            RequestData.model_validate(
                {
                    "requireAdminCredsWhenUpdatingRobotSoftware": True,
                    "requireAdminCredsWhenSendingProtocolToRobot": True,
                    "requireAdminCredsForSignoffProtocol": True,
                    "requireSignoffForProtocolLog": True,
                }
            )
        )

        subject.reset_all()
        result = subject.get_all()
        assert result == ResponseData()

    def test_reset_does_not_affect_other_boolean_settings(
        self,
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
            RequestData.model_validate(
                {"requireAdminCredsWhenUpdatingRobotSoftware": True}
            )
        )
        subject.reset_all()

        with sql_engine.begin() as transaction:
            error_recovery_value = transaction.execute(
                sqlalchemy.select(boolean_setting_table.c.value).where(
                    boolean_setting_table.c.key
                    == BooleanSettingKey.ENABLE_ERROR_RECOVERY
                )
            ).scalar_one_or_none()
        assert error_recovery_value is not None, (
            "reset_all() should not delete non-access-control settings"
        )
