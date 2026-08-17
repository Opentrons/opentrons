from typing import Final, assert_never

from server_utils.auth.scopes import Scope

from auth_server.persistence.orm_models import User
from auth_server.settings.models import SettingsResponseData
from auth_server.users.models import AccountType

_REGULAR_USER_SCOPES: Final[frozenset[Scope]] = frozenset(
    {
        Scope.PROTOCOL_ANALYSES_WRITE,
        Scope.RESTART_WRITE,
        Scope.ROBOT_CONTROL_WRITE,
        Scope.ROBOT_SETTINGS_WRITE,
        Scope.USERS_READ_SELF,
        Scope.USERS_WRITE_SELF,
        Scope.AUDIT_LOG_WRITE,
    }
)


def get_scope_set_of_account_type(
    account_type: AccountType,
    settings: SettingsResponseData,
    must_reset_password: bool,
) -> set[Scope]:
    """Return the scopes that a user is authorized for.

    A user who must reset their password is restricted to reading and writing their
    own account, so they can change their password but nothing else until they do.
    """
    if must_reset_password:
        # Grant the user only the permissions that they need to set a new password,
        # not to actually do anything on the robot.
        return {
            Scope.USERS_READ_SELF,
            Scope.USERS_WRITE_SELF,
        }

    else:
        if account_type == AccountType.ADMIN or account_type == AccountType.SERVICE:
            return set(Scope)  # All scopes.

        elif account_type == AccountType.AUDITOR:
            # Auditors should have read-only access to everything. Our read-only endpoints are
            # mostly accessible without authentication, but there are some exceptions. This
            # just needs to have the scopes to cover those exceptions.
            return {Scope.USERS_READ_OTHERS}

        elif account_type == AccountType.USER:
            result = set(_REGULAR_USER_SCOPES)
            if not settings.requireAdminCredsWhenUpdatingRobotSoftware:
                result.add(Scope.UPDATES_WRITE)
            if not settings.requireAdminCredsWhenSendingProtocolToRobot:
                result.add(Scope.PROTOCOLS_WRITE)
            if not settings.requireAdminCredsForSignoffProtocol:
                result.add(Scope.RUN_SIGNOFF_WRITE)
            return result

        else:
            assert_never(account_type)


def get_scope_set_of_user(
    user: User,
    settings: SettingsResponseData,
    must_reset_password: bool,
) -> set[Scope]:
    """See `get_scope_set_of_account_type()`."""
    return get_scope_set_of_account_type(
        AccountType(user.account_type), settings, must_reset_password
    )
