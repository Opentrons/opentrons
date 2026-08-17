# noqa: D100

from server_utils.auth.scopes import Scope

from auth_server.settings.models import SettingsResponseData
from auth_server.users.models import AccountType
from auth_server.users.scopes import (
    _REGULAR_USER_SCOPES,
    get_scope_set_of_account_type,
)


def test_regular_users_do_not_get_gated_scopes_when_settings_require_admin() -> None:
    user_scopes = get_scope_set_of_account_type(
        AccountType.USER, SettingsResponseData(), must_reset_password=False
    )
    assert user_scopes == set(_REGULAR_USER_SCOPES) | {Scope.RUN_SIGNOFF_WRITE}


def test_regular_users_get_gated_scopes_when_settings_do_not_require_admin() -> None:
    settings = SettingsResponseData(
        requireAdminCredsWhenUpdatingRobotSoftware=False,
        requireAdminCredsWhenSendingProtocolToRobot=False,
        requireAdminCredsForSignoffProtocol=False,
    )
    user_scopes = get_scope_set_of_account_type(
        AccountType.USER, settings, must_reset_password=False
    )
    assert user_scopes == set(_REGULAR_USER_SCOPES) | {
        Scope.UPDATES_WRITE,
        Scope.PROTOCOLS_WRITE,
        Scope.RUN_SIGNOFF_WRITE,
    }


def test_admins_always_get_all_scopes() -> None:
    settings = SettingsResponseData(
        requireAdminCredsWhenUpdatingRobotSoftware=False,
        requireAdminCredsWhenSendingProtocolToRobot=False,
        requireAdminCredsForSignoffProtocol=False,
    )
    admin_scopes = get_scope_set_of_account_type(
        AccountType.ADMIN, settings, must_reset_password=False
    )

    assert admin_scopes == set(Scope)
