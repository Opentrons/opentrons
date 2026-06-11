"""Single source of truth for demo-user HTTPS access-control test cases.

Tests import cases from here; ``scripts/print_demo_access_matrix.py`` renders the
same data as an HTML report (``make demo-access-matrix``). Add or change probes in this file only.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from automation.auth_access import AccessProbe
from automation.clients.auth_models import AccountType
from automation.demo_users import (
    DEMO_ADMIN_USERNAME,
    DEMO_AUDITOR_USERNAME,
    DEMO_OPERATOR_USERNAME,
)

DemoUserRole = Literal["operator", "auditor", "service"]
HttpExpectation = Literal["allow", "forbid"]
LoginExpectation = Literal["allow", "forbid"]
HTTPMethod = Literal["GET", "POST", "PUT", "PATCH", "DELETE"]

_DEMO_USER_CREATE_BODY: dict[str, Any] = {
    "data": {
        "username": "should_not_be_created",
        "password": "NoCreate9Z!",
        "fullName": "scope probe only",
        "accountType": "user",
    },
}

_INVALID_SSH_KEY_BODY: dict[str, Any] = {
    "key": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ==",
}


@dataclass(frozen=True, slots=True)
class HttpAccessCase:
    """One HTTPS probe against the robot proxy for a demo account."""

    demo_user: DemoUserRole
    account_type: AccountType
    label: str
    method: HTTPMethod
    path: str
    scope: str
    expectation: HttpExpectation
    description: str
    json_body: dict[str, Any] | None = None
    allowed_must_be_200: bool = False
    reset_update_session_before: bool = False
    cancel_update_session_after: bool = False

    def to_probe(self) -> AccessProbe:
        return AccessProbe(
            label=self.label,
            method=self.method,
            path=self.path,
            json_body=self.json_body,
        )


@dataclass(frozen=True, slots=True)
class LoginScopeCase:
    """ROPC login scope negotiation for a demo account."""

    demo_user: DemoUserRole
    account_type: AccountType
    description: str
    requested_scope: str
    expectation: LoginExpectation
    expected_granted_scope: str | None = None


@dataclass(frozen=True, slots=True)
class TokenOnlyScopeCase:
    """Scopes verified on the token/profile only (no safe HTTP probe)."""

    demo_user: DemoUserRole
    account_type: AccountType
    scope: str
    description: str


HTTP_ACCESS_CASES: tuple[HttpAccessCase, ...] = (
    # --- operator (user) ---
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="users.read.self",
        method="GET",
        path="/auth/users/self",
        scope="users.read.self",
        expectation="allow",
        description="Operator can read their own user profile.",
    ),
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="protocols.write",
        method="POST",
        path="/protocols",
        scope="protocols.write",
        expectation="allow",
        description="Operator passes protocols.write scope check (may fail validation).",
    ),
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="robot_settings.write",
        method="PUT",
        path="/system/time",
        scope="robot_settings.write",
        expectation="allow",
        description="Operator passes robot_settings.write scope check.",
        json_body={"data": {"id": "time", "systemTime": "not-a-datetime"}},
    ),
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="robot_control.write",
        method="POST",
        path="/runs",
        scope="robot_control.write",
        expectation="allow",
        description="Operator passes robot_control.write scope check.",
        json_body={"data": {}},
    ),
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="updates.write",
        method="POST",
        path="/server/update/begin",
        scope="updates.write",
        expectation="allow",
        description="Operator can begin a software update session.",
        reset_update_session_before=True,
        cancel_update_session_after=True,
    ),
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="auth_settings.write (patch settings)",
        method="PATCH",
        path="/auth/settings",
        scope="auth_settings.write",
        expectation="forbid",
        description="Operator cannot patch auth settings.",
        json_body={"data": {"idleLogout": 900.0}},
    ),
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="auth_settings.write (enable access control)",
        method="PATCH",
        path="/auth/settings/accessControlEnabled",
        scope="auth_settings.write",
        expectation="forbid",
        description="Operator cannot enable access control.",
        json_body={"data": {"accessControlEnabled": True}},
    ),
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="users.read.others",
        method="GET",
        path=f"/auth/users/byUsername/{DEMO_ADMIN_USERNAME}",
        scope="users.read.others",
        expectation="forbid",
        description="Operator cannot read other users.",
    ),
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="users.write",
        method="POST",
        path="/auth/users",
        scope="users.write",
        expectation="forbid",
        description="Operator cannot create users.",
        json_body=_DEMO_USER_CREATE_BODY,
    ),
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="run_data.write",
        method="POST",
        path="/dataFiles",
        scope="run_data.write",
        expectation="forbid",
        description="Operator cannot upload run data files.",
    ),
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="shutdown.write",
        method="POST",
        path="/server/shutdown",
        scope="shutdown.write",
        expectation="forbid",
        description="Operator cannot shut down the robot.",
    ),
    HttpAccessCase(
        demo_user="operator",
        account_type="user",
        label="ssh_keys.write",
        method="POST",
        path="/server/ssh_keys",
        scope="ssh_keys.write",
        expectation="forbid",
        description="Operator cannot manage SSH keys.",
        json_body=_INVALID_SSH_KEY_BODY,
    ),
    # --- auditor ---
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="users.read.others (admin profile)",
        method="GET",
        path=f"/auth/users/byUsername/{DEMO_ADMIN_USERNAME}",
        scope="users.read.others",
        expectation="allow",
        description="Auditor can read the admin user profile.",
        allowed_must_be_200=True,
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="users.read.others (operator profile)",
        method="GET",
        path=f"/auth/users/byUsername/{DEMO_OPERATOR_USERNAME}",
        scope="users.read.others",
        expectation="allow",
        description="Auditor can read the operator user profile.",
        allowed_must_be_200=True,
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="users.read.others (self profile)",
        method="GET",
        path=f"/auth/users/byUsername/{DEMO_AUDITOR_USERNAME}",
        scope="users.read.others",
        expectation="allow",
        description="Auditor can read their own profile via byUsername.",
        allowed_must_be_200=True,
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="users.read.self",
        method="GET",
        path="/auth/users/self",
        scope="users.read.self",
        expectation="forbid",
        description="Auditor cannot use the self endpoint (lacks users.read.self).",
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="auth_settings.write (patch settings)",
        method="PATCH",
        path="/auth/settings",
        scope="auth_settings.write",
        expectation="forbid",
        description="Auditor cannot patch auth settings.",
        json_body={"data": {"idleLogout": 900.0}},
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="auth_settings.write (enable access control)",
        method="PATCH",
        path="/auth/settings/accessControlEnabled",
        scope="auth_settings.write",
        expectation="forbid",
        description="Auditor cannot enable access control.",
        json_body={"data": {"accessControlEnabled": True}},
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="users.write",
        method="POST",
        path="/auth/users",
        scope="users.write",
        expectation="forbid",
        description="Auditor cannot create users.",
        json_body=_DEMO_USER_CREATE_BODY,
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="protocols.write",
        method="POST",
        path="/protocols",
        scope="protocols.write",
        expectation="forbid",
        description="Auditor cannot upload protocols.",
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="robot_settings.write",
        method="PUT",
        path="/system/time",
        scope="robot_settings.write",
        expectation="forbid",
        description="Auditor cannot change robot settings.",
        json_body={"data": {"id": "time", "systemTime": "not-a-datetime"}},
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="robot_control.write",
        method="POST",
        path="/runs",
        scope="robot_control.write",
        expectation="forbid",
        description="Auditor cannot create runs.",
        json_body={"data": {}},
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="updates.write",
        method="POST",
        path="/server/update/begin",
        scope="updates.write",
        expectation="forbid",
        description="Auditor cannot begin software updates.",
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="run_data.write",
        method="POST",
        path="/dataFiles",
        scope="run_data.write",
        expectation="forbid",
        description="Auditor cannot upload run data files.",
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="shutdown.write",
        method="POST",
        path="/server/shutdown",
        scope="shutdown.write",
        expectation="forbid",
        description="Auditor cannot shut down the robot.",
    ),
    HttpAccessCase(
        demo_user="auditor",
        account_type="auditor",
        label="ssh_keys.write",
        method="POST",
        path="/server/ssh_keys",
        scope="ssh_keys.write",
        expectation="forbid",
        description="Auditor cannot manage SSH keys.",
        json_body=_INVALID_SSH_KEY_BODY,
    ),
    # --- service ---
    HttpAccessCase(
        demo_user="service",
        account_type="service",
        label="users.read.self",
        method="GET",
        path="/auth/users/self",
        scope="users.read.self",
        expectation="allow",
        description="Service account can read its own profile.",
    ),
    HttpAccessCase(
        demo_user="service",
        account_type="service",
        label="users.read.others",
        method="GET",
        path=f"/auth/users/byUsername/{DEMO_ADMIN_USERNAME}",
        scope="users.read.others",
        expectation="allow",
        description="Service account can read other users.",
    ),
    HttpAccessCase(
        demo_user="service",
        account_type="service",
        label="auth_settings.write",
        method="PATCH",
        path="/auth/settings",
        scope="auth_settings.write",
        expectation="allow",
        description="Service account can patch auth settings.",
        json_body={"data": {"idleLogout": 900.0}},
    ),
    HttpAccessCase(
        demo_user="service",
        account_type="service",
        label="users.write",
        method="POST",
        path="/auth/users",
        scope="users.write",
        expectation="allow",
        description="Service account passes users.write scope check.",
        json_body=_DEMO_USER_CREATE_BODY,
    ),
    HttpAccessCase(
        demo_user="service",
        account_type="service",
        label="protocols.write",
        method="POST",
        path="/protocols",
        scope="protocols.write",
        expectation="allow",
        description="Service account passes protocols.write scope check.",
    ),
    HttpAccessCase(
        demo_user="service",
        account_type="service",
        label="robot_settings.write",
        method="PUT",
        path="/system/time",
        scope="robot_settings.write",
        expectation="allow",
        description="Service account passes robot_settings.write scope check.",
        json_body={"data": {"id": "time", "systemTime": "not-a-datetime"}},
    ),
    HttpAccessCase(
        demo_user="service",
        account_type="service",
        label="robot_control.write",
        method="POST",
        path="/runs",
        scope="robot_control.write",
        expectation="allow",
        description="Service account passes robot_control.write scope check.",
        json_body={"data": {}},
    ),
    HttpAccessCase(
        demo_user="service",
        account_type="service",
        label="updates.write",
        method="POST",
        path="/server/update/begin",
        scope="updates.write",
        expectation="allow",
        description="Service account can begin a software update session.",
        reset_update_session_before=True,
        cancel_update_session_after=True,
    ),
    HttpAccessCase(
        demo_user="service",
        account_type="service",
        label="run_data.write",
        method="POST",
        path="/dataFiles",
        scope="run_data.write",
        expectation="allow",
        description="Service account passes run_data.write scope check.",
    ),
)

LOGIN_SCOPE_CASES: tuple[LoginScopeCase, ...] = (
    LoginScopeCase(
        demo_user="operator",
        account_type="user",
        description="Operator cannot request scopes beyond their account type.",
        requested_scope="users.write robot_control.write",
        expectation="forbid",
    ),
    LoginScopeCase(
        demo_user="auditor",
        account_type="auditor",
        description="Auditor cannot request scopes beyond their account type.",
        requested_scope="users.read.others users.write",
        expectation="forbid",
    ),
    LoginScopeCase(
        demo_user="service",
        account_type="service",
        description="Service account login rejects unrecognized scope names.",
        requested_scope="not_a_real_scope",
        expectation="forbid",
    ),
    LoginScopeCase(
        demo_user="service",
        account_type="service",
        description="Service account may narrow scopes at login time.",
        requested_scope="robot_control.write",
        expectation="allow",
        expected_granted_scope="robot_control.write",
    ),
)

TOKEN_ONLY_SCOPE_CASES: tuple[TokenOnlyScopeCase, ...] = (
    TokenOnlyScopeCase(
        demo_user="operator",
        account_type="user",
        scope="restart.write",
        description="On token only; POST restart would reboot the robot.",
    ),
    TokenOnlyScopeCase(
        demo_user="service",
        account_type="service",
        scope="restart.write",
        description="On token only; POST restart would reboot the robot.",
    ),
    TokenOnlyScopeCase(
        demo_user="service",
        account_type="service",
        scope="shutdown.write",
        description="On token only; POST shutdown would power off the robot.",
    ),
    TokenOnlyScopeCase(
        demo_user="service",
        account_type="service",
        scope="ssh_keys.write",
        description="On token only; SSH key API requires link-local wired connection.",
    ),
)


def http_cases_for(
    demo_user: DemoUserRole,
    expectation: HttpExpectation | None = None,
) -> tuple[HttpAccessCase, ...]:
    """Return HTTP cases for one demo user, optionally filtered by allow/forbid."""

    cases = [case for case in HTTP_ACCESS_CASES if case.demo_user == demo_user]
    if expectation is not None:
        cases = [case for case in cases if case.expectation == expectation]
    return tuple(cases)


def login_cases_for(demo_user: DemoUserRole) -> tuple[LoginScopeCase, ...]:
    return tuple(case for case in LOGIN_SCOPE_CASES if case.demo_user == demo_user)


def token_only_cases_for(demo_user: DemoUserRole) -> tuple[TokenOnlyScopeCase, ...]:
    return tuple(case for case in TOKEN_ONLY_SCOPE_CASES if case.demo_user == demo_user)
