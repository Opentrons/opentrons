"""Tests for account-type OAuth 2 scope assignment."""

import pytest

from server_utils.auth.scopes import Scope

from auth_server.settings.models import SettingsResponseData
from auth_server.users.models import AccountType
from auth_server.users.scopes import get_scope_set_of_account_type

_AUDITOR_SCOPES = {
    Scope.USERS_READ_OTHERS,
    Scope.USERS_READ_SELF,
    Scope.USERS_WRITE_SELF,
}


def _settings_that_grant_users_extra_write_scopes() -> SettingsResponseData:
    return SettingsResponseData(
        requireAdminCredsWhenUpdatingRobotSoftware=False,
        requireAdminCredsWhenSendingProtocolToRobot=False,
        requireAdminCredsForSignoffProtocol=False,
    )


@pytest.mark.parametrize(
    "settings",
    [SettingsResponseData(), _settings_that_grant_users_extra_write_scopes()],
)
def test_auditor_scopes_are_read_only(settings: SettingsResponseData) -> None:
    scopes = get_scope_set_of_account_type(
        AccountType.AUDITOR, settings, must_reset_password=False
    )

    assert scopes == _AUDITOR_SCOPES
    assert Scope.ROBOT_CONTROL_WRITE not in scopes
    assert Scope.ROBOT_SETTINGS_WRITE not in scopes
    assert Scope.PROTOCOLS_WRITE not in scopes
    assert Scope.RESTART_WRITE not in scopes
