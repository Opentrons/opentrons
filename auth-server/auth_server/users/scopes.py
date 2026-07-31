from server_utils.auth.scopes import Scope

from auth_server.persistence.orm_models import User
from auth_server.users.models import AccountType

ACCOUNT_TYPE_TO_SCOPES: dict[AccountType, set[Scope]] = {
    AccountType.ADMIN: set(Scope),  # all scopes
    AccountType.SERVICE: set(Scope),  # all scopes
    AccountType.USER: {
        Scope.RESTART_WRITE,
        Scope.ROBOT_CONTROL_WRITE,
        Scope.ROBOT_SETTINGS_WRITE,
        # todo(mm, 2026-03-17): Updates should be togglable to admin-only by an auth setting.
        Scope.UPDATES_WRITE,
        Scope.USERS_READ_SELF,
        Scope.USERS_WRITE_SELF,
        # todo(mm, 2026-03-17): Protocol uploads should be togglable to admin-only by an auth setting.
        Scope.PROTOCOLS_WRITE,
        Scope.AUDIT_LOG_WRITE,
    },
    # Auditors should have read-only access to everything. Our read-only endpoints are
    # mostly accessible without authentication, but there are some exceptions. This
    # just needs to have the scopes to cover those exceptions.
    AccountType.AUDITOR: {Scope.USERS_READ_OTHERS},
}

# Scopes granted while resetPassword is true, before the user chooses a new password.
RESET_PASSWORD_SCOPES: set[Scope] = {
    Scope.USERS_READ_SELF,
    Scope.USERS_WRITE_SELF,
}


def get_scope_set_of_user(
    user: User,
    must_reset_password: bool,
) -> set[Scope]:
    """Return the scopes that a user is authorized for.

    A user who must reset their password is restricted to reading and writing their
    own account, so they can change their password but nothing else until they do.
    """
    if must_reset_password:
        return set(RESET_PASSWORD_SCOPES)
    return set(ACCOUNT_TYPE_TO_SCOPES[AccountType(user.account_type)])
