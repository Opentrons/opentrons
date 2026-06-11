"""Hardcoded demo account names, passwords, and expected OAuth scopes."""

from __future__ import annotations

from automation.clients.auth_models import AccountType

DEMO_ADMIN_USERNAME = "demo_admin"
DEMO_ADMIN_PASSWORD = "DemoP@ss1234!"
DEMO_ADMIN_FULL_NAME = "Demo administrator"

DEMO_OPERATOR_USERNAME = "demo_operator"
DEMO_OPERATOR_FULL_NAME = "Demo operator"

DEMO_AUDITOR_USERNAME = "demo_auditor"
DEMO_AUDITOR_FULL_NAME = "Demo auditor"
DEMO_SERVICE_USERNAME = "demo_service"
DEMO_SERVICE_FULL_NAME = "Demo service account"

DEFAULT_DEMO_PASSWORD = DEMO_ADMIN_PASSWORD
DEFAULT_DEMO_PREFIX = "demo_"

# Mirrors auth_server.users.models.ACCOUNT_TYPE_TO_SCOPES for ``AccountType.USER``.
OPERATOR_SCOPES: frozenset[str] = frozenset(
    {
        "protocols.write",
        "restart.write",
        "robot_control.write",
        "robot_settings.write",
        "updates.write",
        "users.read.self",
    }
)

# Scopes assigned to admin/service but not to operators.
OPERATOR_FORBIDDEN_SCOPES: frozenset[str] = frozenset(
    {
        "auth_settings.write",
        "run_data.write",
        "shutdown.write",
        "ssh_keys.write",
        "users.read.others",
        "users.write",
    }
)

# Mirrors auth_server.users.models.ACCOUNT_TYPE_TO_SCOPES for ``AccountType.AUDITOR``.
AUDITOR_SCOPES: frozenset[str] = frozenset({"users.read.others"})

# Every other scope; auditors are read-only and only cover the user-list exception.
AUDITOR_FORBIDDEN_SCOPES: frozenset[str] = frozenset(
    {
        "auth_settings.write",
        "protocols.write",
        "restart.write",
        "robot_control.write",
        "robot_settings.write",
        "run_data.write",
        "shutdown.write",
        "ssh_keys.write",
        "updates.write",
        "users.read.self",
        "users.write",
    }
)

# Mirrors auth_server.users.models.ACCOUNT_TYPE_TO_SCOPES for admin/service (all scopes).
SERVICE_SCOPES: frozenset[str] = frozenset(
    {
        "auth_settings.write",
        "protocols.write",
        "restart.write",
        "robot_control.write",
        "robot_settings.write",
        "run_data.write",
        "shutdown.write",
        "ssh_keys.write",
        "updates.write",
        "users.read.others",
        "users.read.self",
        "users.write",
    }
)

DEMO_ACCOUNT_SPECS: tuple[tuple[str, AccountType, str], ...] = (
    ("operator", "user", DEMO_OPERATOR_FULL_NAME),
    ("auditor", "auditor", DEMO_AUDITOR_FULL_NAME),
    ("service", "service", DEMO_SERVICE_FULL_NAME),
)
