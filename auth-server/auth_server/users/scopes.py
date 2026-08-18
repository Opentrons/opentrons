from typing import assert_never

from server_utils.auth.scopes import Scope

from auth_server.persistence.orm_models import User
from auth_server.settings.models import SettingsResponseData
from auth_server.users.models import AccountType


def get_scope_set_of_account_type(
    account_type: AccountType,
    settings: SettingsResponseData,
    must_reset_password: bool,
) -> set[Scope]:
    """Return the scopes that a user is authorized for.

    A user who must reset their password is restricted to reading and writing their
    own account, so they can change their password but nothing else until they do.

    ``settings`` is unused. requireAdminCreds* flags are enforced at request time
    so user tokens always include the matching write scopes (RQA-5854, RQA-5855).
    """
    del settings
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
            # User tokens always include these write scopes. requireAdminCreds* is a
            # separate request-time gate so flipping a flag cannot leave stale
            # permissions on an old token, and so a user is not 403'd for a missing
            # scope when the flag is on (RQA-5854, RQA-5855).
            return {
                Scope.PROTOCOL_ANALYSES_WRITE,
                Scope.RESTART_WRITE,
                Scope.ROBOT_CONTROL_WRITE,
                Scope.ROBOT_SETTINGS_WRITE,
                Scope.USERS_READ_SELF,
                Scope.USERS_WRITE_SELF,
                Scope.AUDIT_LOG_WRITE,
                Scope.UPDATES_WRITE,
                Scope.PROTOCOLS_WRITE,
                Scope.RUN_SIGNOFF_WRITE,
            }

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
