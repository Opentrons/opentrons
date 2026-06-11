"""Component tests for the Flex auth-server (HTTP, no browser)."""

from __future__ import annotations

import uuid

import httpx
import pytest

from automation.auth_helpers import (
    AdminSession,
    ProvisionedTestUser,
    create_test_user_under_admin,
)
from automation.clients.auth import AuthClient


@pytest.mark.auth_api
async def test_admin_session_and_provisioned_user_round_trip(
    auth_client: AuthClient,
    admin_session: AdminSession,
    provisioned_test_user: ProvisionedTestUser,
) -> None:
    """Admin can create a user; that user can log in; GET user matches create response."""

    fetched = await auth_client.get_user(admin_session.token, provisioned_test_user.user_name)
    assert fetched.user_name == provisioned_test_user.user_name
    assert fetched.full_name == provisioned_test_user.full_name
    assert fetched.account_type == "user"
    assert fetched.locked is False

    user_token = await auth_client.get_token(
        provisioned_test_user.user_name,
        provisioned_test_user.password,
    )
    assert user_token.access_token


@pytest.mark.auth_api
async def test_patch_second_user_username_to_first_users_name_returns_400(
    auth_client: AuthClient,
    admin_session: AdminSession,
) -> None:
    """Renaming user B to user A's username is rejected with the same body as duplicate POST."""

    admin = admin_session
    suffix = uuid.uuid4().hex[:12]
    first = f"e2e_name_clash_{suffix}_a"
    second = f"e2e_name_clash_{suffix}_b"
    password = "e2e-clash-pw-9Z!"
    try:
        await create_test_user_under_admin(
            auth_client,
            admin,
            user_name=first,
            password=password,
            full_name="First clash user",
            account_type="user",
        )
        await create_test_user_under_admin(
            auth_client,
            admin,
            user_name=second,
            password=password,
            full_name="Second clash user",
            account_type="user",
        )
        response = await auth_client.update_user_response(
            admin.token,
            second,
            user_name_new=first,
        )
        assert response.status_code == 400
        assert response.json() == {"detail": "User already exists"}
    finally:
        for user_name in (second, first):
            try:
                await auth_client.delete_user(admin.token, user_name)
            except httpx.HTTPStatusError:
                pass


@pytest.mark.auth_api
async def test_patch_access_control_enabled_once_then_rejects_second_patch(
    auth_client: AuthClient,
    admin_session: AdminSession,
) -> None:
    """Admin enables access control; GET reflects it; a second PATCH returns 422.

    On a fresh robot, access control starts **off**. This test mutates robot-wide
    auth settings; it is ordered last via ``pytest_collection_modifyitems``.
    """

    admin = admin_session
    before = await auth_client.get_access_control_settings()
    if before.access_control_enabled:
        pytest.skip(
            "access control already enabled on this server (reused long-lived "
            "instance or stale DB; use isolated persistence or a free port)"
        )

    # Try to enable AC by PATCHing with True
    enabled = await auth_client.patch_access_control_enabled(admin.token)
    assert enabled.access_control_enabled is True

    # GET reflects it
    after_get = await auth_client.get_access_control_settings()
    assert after_get.access_control_enabled is True

    # Try to disable AC by PATCHing with False (only ``true`` is allowed in the schema)
    disable = await auth_client.patch_access_control_disabled_response(admin.token)
    assert disable.status_code == 422
    assert disable.json() == {
        "detail": [
            {
                "ctx": {"expected": "True"},
                "input": False,
                "loc": ["body", "data", "accessControlEnabled"],
                "msg": "Input should be True",
                "type": "literal_error",
                "url": "https://errors.pydantic.dev/2.11/v/literal_error",
            },
        ],
    }

    # Try to enable AC by PATCHing with True (duplicate request)
    conflict = await auth_client.patch_access_control_enabled_response(admin.token)
    assert conflict.status_code == 422
    assert conflict.json() == {
        "detail": "Access control enabled cannot be modified once enabled.",
    }
