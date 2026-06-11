#!/usr/bin/env python3
"""Create demo accounts on a Flex robot at each auth-server account type.

Uses hardcoded :data:`DEMO_ADMIN` credentials when that account exists. Otherwise
provisions without login if access control is disabled, or falls back to
``AUTH_USERNAME`` / ``AUTH_PASSWORD`` when access control is on.

Usage:
    uv run python scripts/provision_demo_users.py 192.168.0.20
    ROBOT_IP=192.168.0.20 uv run python scripts/provision_demo_users.py

    # Replace accounts that already exist
    uv run python scripts/provision_demo_users.py 192.168.0.20 --replace

Requires robot CA trust in ``robot-certs/``.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from dataclasses import dataclass

import httpx
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from automation.auth_helpers import (
    AdminSession,
    ProvisionedTestUser,
    create_test_user_under_admin,
)
from automation.clients.auth import AuthClient
from automation.clients.auth_models import AccountType, UserResponse
from automation.demo_users import (
    DEFAULT_DEMO_PASSWORD,
    DEFAULT_DEMO_PREFIX,
    DEMO_ACCOUNT_SPECS,
    DEMO_ADMIN_FULL_NAME,
    DEMO_ADMIN_PASSWORD,
    DEMO_ADMIN_USERNAME,
)
from automation.robot_certs.registry import RobotCertRegistryError

load_dotenv()

console = Console()

DEFAULT_PASSWORD = DEFAULT_DEMO_PASSWORD
DEFAULT_PREFIX = DEFAULT_DEMO_PREFIX


@dataclass(frozen=True, slots=True)
class DemoUserSpec:
    """Definition of one demo account to create."""

    user_name: str
    password: str
    full_name: str
    account_type: AccountType


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Provision demo users at each auth-server account type on a Flex robot.",
    )
    parser.add_argument(
        "robot_ip",
        nargs="?",
        default=os.environ.get("ROBOT_IP"),
        help="Robot hostname or IP (default: ROBOT_IP from environment)",
    )
    parser.add_argument(
        "--prefix",
        default=os.environ.get("DEMO_USERS_PREFIX", DEFAULT_PREFIX),
        help=f"Username prefix (default: {DEFAULT_PREFIX!r})",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("DEMO_USERS_PASSWORD", DEFAULT_PASSWORD),
        help="Password shared by all demo accounts",
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete existing demo accounts before creating them",
    )
    return parser.parse_args(argv)


def _build_specs(prefix: str, password: str) -> list[DemoUserSpec]:
    admin = DemoUserSpec(
        user_name=DEMO_ADMIN_USERNAME,
        password=DEMO_ADMIN_PASSWORD,
        full_name=DEMO_ADMIN_FULL_NAME,
        account_type="admin",
    )
    others = [
        DemoUserSpec(
            user_name=f"{prefix}{suffix}",
            password=password,
            full_name=full_name,
            account_type=account_type,
        )
        for suffix, account_type, full_name in DEMO_ACCOUNT_SPECS
    ]
    return [admin, *others]


@dataclass(frozen=True, slots=True)
class BootstrapContext:
    """Who performs user CRUD: logged-in admin or unauthenticated (AC off)."""

    label: str
    admin: AdminSession | None


async def _resolve_bootstrap(client: AuthClient) -> BootstrapContext:
    """Prefer hardcoded demo_admin, then env admin, then unauthenticated if AC is off."""

    try:
        token = await client.get_token(DEMO_ADMIN_USERNAME, DEMO_ADMIN_PASSWORD)
    except httpx.HTTPStatusError:
        pass
    else:
        return BootstrapContext(
            label="demo_admin (hardcoded)",
            admin=AdminSession(
                username=DEMO_ADMIN_USERNAME,
                password=DEMO_ADMIN_PASSWORD,
                token=token,
            ),
        )

    username = os.environ.get("AUTH_USERNAME", "").strip()
    password = os.environ.get("AUTH_PASSWORD", "").strip()
    if username and password:
        token = await client.get_token(username, password)
        return BootstrapContext(
            label=f"{username} (AUTH_USERNAME fallback)",
            admin=AdminSession(username=username, password=password, token=token),
        )

    access_control = await client.get_access_control_settings()
    if not access_control.access_control_enabled:
        return BootstrapContext(label="no auth (access control disabled)", admin=None)

    raise ValueError(
        "Could not log in as demo_admin and access control is enabled. "
        "Set AUTH_USERNAME and AUTH_PASSWORD to an admin account."
    )


async def _create_user(
    client: AuthClient,
    bootstrap: BootstrapContext,
    spec: DemoUserSpec,
) -> UserResponse:
    if bootstrap.admin is None:
        return await client.create_user(
            None,
            user_name=spec.user_name,
            password=spec.password,
            full_name=spec.full_name,
            account_type=spec.account_type,
        )
    return (
        await create_test_user_under_admin(
            client,
            bootstrap.admin,
            user_name=spec.user_name,
            password=spec.password,
            full_name=spec.full_name,
            account_type=spec.account_type,
        )
    ).profile


async def _delete_if_present(
    client: AuthClient,
    bootstrap: BootstrapContext,
    user_name: str,
) -> bool:
    """Return True if a user was deleted."""

    token = bootstrap.admin.token if bootstrap.admin else None
    try:
        await client.delete_user(token, user_name)
    except httpx.HTTPStatusError as err:
        if err.response.status_code == 404:
            return False
        raise
    return True


async def _provision_one(
    client: AuthClient,
    bootstrap: BootstrapContext,
    spec: DemoUserSpec,
    *,
    replace: bool,
) -> ProvisionedTestUser:
    admin = bootstrap.admin
    if (
        replace
        and spec.user_name == DEMO_ADMIN_USERNAME
        and admin is not None
        and admin.username == DEMO_ADMIN_USERNAME
    ):
        profile = await client.update_user(
            admin.token,
            DEMO_ADMIN_USERNAME,
            password=spec.password,
            full_name=spec.full_name,
            account_type=spec.account_type,
        )
        return ProvisionedTestUser(
            user_name=spec.user_name,
            password=spec.password,
            full_name=spec.full_name,
            account_type=spec.account_type,
            profile=profile,
        )

    if replace:
        await _delete_if_present(client, bootstrap, spec.user_name)

    try:
        profile = await _create_user(client, bootstrap, spec)
        return ProvisionedTestUser(
            user_name=spec.user_name,
            password=spec.password,
            full_name=spec.full_name,
            account_type=spec.account_type,
            profile=profile,
        )
    except httpx.HTTPStatusError as err:
        if err.response.status_code == 400 and not replace:
            detail = err.response.json()
            if detail.get("detail") == "User already exists":
                raise SystemExit(
                    f"User {spec.user_name!r} already exists. Pass --replace to delete and recreate demo accounts."
                ) from err
        raise


def _print_summary(
    robot_ip: str,
    bootstrap_admin: str,
    created: list[ProvisionedTestUser],
    login_ok: dict[str, bool],
) -> None:
    table = Table(title="Demo accounts", show_lines=True)
    table.add_column("Username", style="cyan")
    table.add_column("Account type")
    table.add_column("Login OK")
    table.add_column("Scopes")

    for user in created:
        scopes = ", ".join(user.profile.scopes)
        table.add_row(
            user.user_name,
            user.account_type,
            "yes" if login_ok[user.user_name] else "no",
            scopes or "(none)",
        )

    console.print(
        Panel(
            table,
            title=f"Provisioned on {robot_ip}",
            subtitle=f"Created with bootstrap admin {bootstrap_admin!r}",
            border_style="green",
        )
    )


async def main(argv: list[str] | None = None) -> None:
    args = _parse_args(argv if argv is not None else sys.argv[1:])
    if not args.robot_ip:
        console.print(
            "[yellow]Pass a robot IP or set ROBOT_IP.[/yellow]\n"
            "  Example: uv run python scripts/provision_demo_users.py 192.168.0.20"
        )
        raise SystemExit(1)

    if not args.password.strip():
        console.print("[red]Demo user password must not be empty.[/red]")
        raise SystemExit(1)

    try:
        client = AuthClient(args.robot_ip)
    except RobotCertRegistryError as err:
        console.print(Panel(f"[red]{err}[/red]", title="HTTPS setup failed", border_style="red"))
        raise SystemExit(1) from err

    specs = _build_specs(args.prefix, args.password)

    async with client:
        if not await client.is_alive():
            console.print(
                Panel(
                    Text.from_markup(f"[red]Auth-server not reachable at[/red] [dim]{client.base_url}[/dim]"),
                    title="Connection failed",
                    border_style="red",
                )
            )
            raise SystemExit(1)

        try:
            bootstrap = await _resolve_bootstrap(client)
        except ValueError as err:
            console.print(f"[red]{err}[/red]")
            raise SystemExit(1) from err

        console.print(f"Using bootstrap [bold]{bootstrap.label}[/bold]; creating {len(specs)} demo accounts...")

        created: list[ProvisionedTestUser] = []
        admin_spec, *other_specs = specs
        for spec in [*other_specs, admin_spec]:
            user = await _provision_one(client, bootstrap, spec, replace=args.replace)
            created.append(user)
            console.print(
                f"  [green]created[/green] {user.user_name} ({user.account_type}, {len(user.profile.scopes)} scopes)"
            )

        login_ok: dict[str, bool] = {}
        for user in created:
            try:
                token = await client.get_token(user.user_name, user.password)
                login_ok[user.user_name] = bool(token.access_token)
            except httpx.HTTPStatusError:
                login_ok[user.user_name] = False

        _print_summary(args.robot_ip, bootstrap.label, created, login_ok)

        if not all(login_ok.values()):
            console.print("[red]One or more demo accounts could not log in.[/red]")
            raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
