"""Tests for account-type → scope mapping."""

from auth_server.users.models import ACCOUNT_TYPE_TO_SCOPES, AccountType
from server_utils.auth.scopes import Scope


def test_system_time_write_is_admin_only() -> None:
    """PUT /system/time requires SYSTEM_TIME_WRITE; only admin/service get it."""
    assert Scope.SYSTEM_TIME_WRITE in ACCOUNT_TYPE_TO_SCOPES[AccountType.ADMIN]
    assert Scope.SYSTEM_TIME_WRITE in ACCOUNT_TYPE_TO_SCOPES[AccountType.SERVICE]
    assert Scope.SYSTEM_TIME_WRITE not in ACCOUNT_TYPE_TO_SCOPES[AccountType.USER]
    assert Scope.SYSTEM_TIME_WRITE not in ACCOUNT_TYPE_TO_SCOPES[AccountType.AUDITOR]
