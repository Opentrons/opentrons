#!/usr/bin/env python3
"""Exercise ``AuthClient`` against a running auth-server with no stdout.

This file is a silent companion to ``check_auth.py``. Read the numbered ``#``
blocks to see how the client maps to HTTP calls and ``auth_models`` types.

Run (no console output on success):
    uv run python scripts/check_auth_quiet.py localhost
    ROBOT_IP=localhost uv run python scripts/check_auth_quiet.py

Exit codes: 0 success, 1 missing host or ``is_alive`` is False. Other failures raise (stderr).
"""

from __future__ import annotations

import asyncio
import os
import sys

import httpx
from dotenv import load_dotenv

from automation.clients.auth import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    USER_PASSWORD,
    USER_USERNAME,
    AuthClient,
)

load_dotenv()

AUTH_SERVER_PORT = 33950

TEMP_USER_NAME = "_tutorial_temp_user"
TEMP_USER_PASSWORD = "TempP@ss1234!"
TEMP_USER_FULL_NAME = "tutorial temp user"


def resolve_host() -> str:
    if len(sys.argv) > 1:
        return sys.argv[1]
    env_host = os.environ.get("ROBOT_IP")
    if env_host:
        return env_host
    raise SystemExit(1)


async def main() -> None:
    host = resolve_host()
    base_url = f"http://{host}:{AUTH_SERVER_PORT}".rstrip("/")

    async with AuthClient(base_url=base_url) as client:
        # -----------------------------------------------------------------
        # 0) ``AuthClient.is_alive()`` calls ``get_settings()`` internally.
        # True means GET /auth/settings returned 2xx and the JSON matched
        # AuthSettingsResponse + SettingsData. Prefer this over /health when
        # you care that the auth API (not just TCP) is healthy.
        # -----------------------------------------------------------------
        if not await client.is_alive():
            raise SystemExit(1)

        # -----------------------------------------------------------------
        # 1) Human docs: open http://<host>:33950/auth/redoc in a browser.
        # Same schema as GET /auth/openapi.json (see step 2).
        # -----------------------------------------------------------------

        # -----------------------------------------------------------------
        # 2) ``get_openapi()`` -> GET /auth/openapi.json -> OpenApiDocument.
        # Compare ``paths`` keys to methods on AuthClient.
        # -----------------------------------------------------------------
        _ = await client.get_openapi()

        # -----------------------------------------------------------------
        # 3) ``get_settings()`` -> GET /auth/settings -> validates ``{data}``
        # envelope -> SettingsData (camelCase in JSON, snake_case on model).
        # -----------------------------------------------------------------
        _ = await client.get_settings()

        # -----------------------------------------------------------------
        # 4) ``get_access_control_settings()`` -> GET
        # /auth/settings/accessControlEnabled -> AccessControlData.
        # -----------------------------------------------------------------
        _ = await client.get_access_control_settings()

        # -----------------------------------------------------------------
        # 5) ``get_token(user, password)`` -> POST /auth/oauth2/token with
        # ``application/x-www-form-urlencoded`` (grant_type=password, ...).
        # Parses TokenResponse.
        # -----------------------------------------------------------------
        admin_token = await client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD)

        # -----------------------------------------------------------------
        # 6) ``introspect(access_token)`` -> POST /auth/oauth2/introspect
        # (form fields token + client_id). TokenIntrospectionResponse.
        # -----------------------------------------------------------------
        _ = await client.introspect(admin_token.access_token)

        # -----------------------------------------------------------------
        # 7) ``refresh_token(refresh_string)`` hits the same token URL with
        # grant_type=refresh_token. Skip if the password grant returned no
        # refresh_token.
        # -----------------------------------------------------------------
        if admin_token.refresh_token:
            _ = await client.refresh_token(admin_token.refresh_token)

        # -----------------------------------------------------------------
        # 8) Optional ``scope=`` on ``get_token`` adds a form field for a
        # narrower access token.
        # -----------------------------------------------------------------
        _ = await client.get_token(ADMIN_USERNAME, ADMIN_PASSWORD, scope="users.read")

        # -----------------------------------------------------------------
        # 9) ``get_user(token, name)`` -> GET /auth/users/{name} with header
        # Authorization: Bearer <access_token> (see ``AuthClient.auth_header``).
        # Response ``data`` -> UserResponse.
        # -----------------------------------------------------------------
        for name in (ADMIN_USERNAME, USER_USERNAME):
            _ = await client.get_user(admin_token, name)

        # -----------------------------------------------------------------
        # 10) ``create_user`` -> POST /auth/users with JSON body {"data":{...}}.
        # ``update_user`` -> PATCH with only changed fields. ``delete_user``
        # -> DELETE. All require a token with users.read / users.write scopes.
        # -----------------------------------------------------------------
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
        await client.delete_user(admin_token, TEMP_USER_NAME)

        # -----------------------------------------------------------------
        # 11) ``get_token_raw`` returns httpx.Response without
        # raise_for_status; use when teaching or testing error status codes and
        # bodies (e.g. wrong password).
        # -----------------------------------------------------------------
        bad = await client.get_token_raw(
            grant_type="password",
            client_id=client.client_id,
            username=ADMIN_USERNAME,
            password="wrong_password_intentionally",
        )
        # Wrong password: see auth-server integration "Wrong username and password".
        assert bad.status_code == 400, f"expected HTTP 400, got {bad.status_code}: {bad.text!r}"
        err_body = bad.json()
        assert err_body.get("error") == "invalid_grant", err_body
        err_msg = err_body.get("error_description")
        assert isinstance(err_msg, str) and err_msg.strip(), err_body

        # -----------------------------------------------------------------
        # 12) ``asyncio.gather`` runs several client coroutines concurrently
        # (single-threaded async I/O).
        # -----------------------------------------------------------------
        user_token = await client.get_token(USER_USERNAME, USER_PASSWORD)

        async def intro_label(token: str) -> str:
            p = await client.introspect(token)
            return "active" if p.active else "inactive"

        _ = await asyncio.gather(
            intro_label(admin_token.access_token),
            intro_label(user_token.access_token),
            client.get_user(admin_token, USER_USERNAME),
        )


if __name__ == "__main__":
    asyncio.run(main())
