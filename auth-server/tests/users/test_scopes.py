# noqa: D100

from server_utils.auth.scopes import Scope

from auth_server.settings.models import SettingsResponseData
from auth_server.users.models import AccountType
from auth_server.users.scopes import (
    _ADMIN_ONLY_SCOPES,
    _REGULAR_USER_SCOPES,
    get_scope_set_of_account_type,
)


def test_regular_users_do_not_get_admin_only_scopes() -> None:
    user_scopes = get_scope_set_of_account_type(
        AccountType.USER, SettingsResponseData(), must_reset_password=False
    )
    assert user_scopes == set(_REGULAR_USER_SCOPES)
    assert user_scopes.isdisjoint(_ADMIN_ONLY_SCOPES)


def test_admins_get_enabled_admin_only_scopes_with_default_settings() -> None:
    settings = SettingsResponseData()
    admin_scopes = get_scope_set_of_account_type(
        AccountType.ADMIN, settings, must_reset_password=False
    )

    assert Scope.UPDATES_WRITE in admin_scopes
    assert Scope.PROTOCOLS_WRITE in admin_scopes
    assert Scope.RUN_SIGNOFF_WRITE not in admin_scopes
    assert admin_scopes == (set(Scope) - _ADMIN_ONLY_SCOPES) | {
        Scope.UPDATES_WRITE,
        Scope.PROTOCOLS_WRITE,
    }


def test_admins_lose_gated_scopes_when_settings_are_disabled() -> None:
    settings = SettingsResponseData(
        requireAdminCredsWhenUpdatingRobotSoftware=False,
        requireAdminCredsWhenSendingProtocolToRobot=False,
        requireAdminCredsForSignoffProtocol=False,
    )
    admin_scopes = get_scope_set_of_account_type(
        AccountType.ADMIN, settings, must_reset_password=False
    )

    assert admin_scopes.isdisjoint(_ADMIN_ONLY_SCOPES)
    assert admin_scopes == set(Scope) - _ADMIN_ONLY_SCOPES


def test_admins_get_run_signoff_when_signoff_setting_is_enabled() -> None:
    settings = SettingsResponseData(requireAdminCredsForSignoffProtocol=True)
    admin_scopes = get_scope_set_of_account_type(
        AccountType.ADMIN, settings, must_reset_password=False
    )

    assert Scope.RUN_SIGNOFF_WRITE in admin_scopes
