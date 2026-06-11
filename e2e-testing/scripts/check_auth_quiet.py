#!/usr/bin/env python3
"""Exercise ``AuthClient`` against a Flex robot with no stdout.

Run (no console output on success):
    uv run python scripts/check_auth_quiet.py 192.168.0.20
    ROBOT_IP=192.168.0.20 uv run python scripts/check_auth_quiet.py

Requires ``AUTH_USERNAME`` / ``AUTH_PASSWORD`` and robot CA trust in ``robot-certs/``.

Exit codes: 0 success, 1 missing host/credentials or ``is_alive`` is False. Other failures raise (stderr).
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys

import httpx
from dotenv import load_dotenv

from automation.auth_helpers import obtain_admin_session, resolve_admin_credentials
from automation.clients.auth import AuthClient
from automation.robot_certs.registry import RobotCertRegistryError

load_dotenv()

TEMP_USER_NAME = "_tutorial_temp_user"
TEMP_USER_PASSWORD = "TempP@ss1234!"
TEMP_USER_FULL_NAME = "tutorial temp user"


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Silent AuthClient walkthrough against a Flex robot.")
    parser.add_argument(
        "robot_ip",
        nargs="?",
        default=os.environ.get("ROBOT_IP"),
        help="Robot hostname or IP (default: ROBOT_IP from environment)",
    )
    return parser.parse_args(argv)


async def main(argv: list[str] | None = None) -> None:
    args = _parse_args(argv if argv is not None else sys.argv[1:])
    if not args.robot_ip:
        raise SystemExit(1)

    try:
        resolve_admin_credentials()
    except ValueError:
        raise SystemExit(1) from None

    try:
        client = AuthClient(args.robot_ip)
    except RobotCertRegistryError:
        raise SystemExit(1) from None

    async with client:
        if not await client.is_alive():
            raise SystemExit(1)

        _ = await client.get_openapi()
        _ = await client.get_settings()
        _ = await client.get_access_control_settings()

        admin = await obtain_admin_session(client)
        admin_token = admin.token

        _ = await client.introspect(admin_token.access_token)

        if admin_token.refresh_token:
            _ = await client.refresh_token(admin_token.refresh_token)

        _ = await client.get_token(admin.username, admin.password, scope="users.read")

        _ = await client.get_user(admin_token, admin.username)

        try:
            await client.delete_user(admin_token, TEMP_USER_NAME)
        except httpx.HTTPStatusError:
            pass

        _ = await client.create_user(
            admin_token,
            user_name=TEMP_USER_NAME,
            password=TEMP_USER_PASSWORD,
            full_name=TEMP_USER_FULL_NAME,
            account_type="auditor",
        )
        _ = await client.update_user(
            admin_token,
            TEMP_USER_NAME,
            full_name="Updated display name",
            account_type="user",
        )
        _ = await client.get_user(admin_token, TEMP_USER_NAME)

        bad = await client.get_token_raw(
            grant_type="password",
            client_id=client.client_id,
            username=admin.username,
            password="wrong_password_intentionally",
        )
        assert bad.status_code == 400, f"expected HTTP 400, got {bad.status_code}: {bad.text!r}"
        err_body = bad.json()
        assert err_body.get("error") == "invalid_grant", err_body
        err_msg = err_body.get("error_description")
        assert isinstance(err_msg, str) and err_msg.strip(), err_body

        user_token = await client.get_token(TEMP_USER_NAME, TEMP_USER_PASSWORD)

        async def intro_label(token: str) -> str:
            p = await client.introspect(token)
            return "active" if p.active else "inactive"

        _ = await asyncio.gather(
            intro_label(admin_token.access_token),
            intro_label(user_token.access_token),
            client.get_user(admin_token, TEMP_USER_NAME),
        )

        await client.delete_user(admin_token, TEMP_USER_NAME)


if __name__ == "__main__":
    asyncio.run(main())
