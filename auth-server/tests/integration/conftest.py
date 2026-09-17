import httpx
import pytest

from ..dev_server import DevServer

_ADMIN_USERNAME = "testadmin"
_ADMIN_PASSWORD = "testadminpassword"
_USER_USERNAME = "testuser"
_USER_PASSWORD = "testuserpassword"
_CLIENT_ID = "opentrons_app"


@pytest.fixture
async def seed_users(run_server: DevServer) -> None:
    async with httpx.AsyncClient() as client:
        make_admin = await client.post(
            f"{run_server.base_url}/auth/users",
            json={
                "data": {
                    "username": _ADMIN_USERNAME,
                    "password": _ADMIN_PASSWORD,
                    "fullName": "Test Admin",
                    "accountType": "admin",
                }
            },
        )
        make_admin.raise_for_status()
        make_user = await client.post(
            f"{run_server.base_url}/auth/users",
            json={
                "data": {
                    "username": _USER_USERNAME,
                    "password": _USER_PASSWORD,
                    "fullName": "Test User",
                    "accountType": "user",
                }
            },
        )
        make_user.raise_for_status()


@pytest.fixture
async def admin_access_token(run_server: DevServer, seed_users: None) -> str:
    """ "Log in" as an admin and return an access token with admin privileges."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{run_server.base_url}/auth/oauth2/token",
            data={
                "client_id": _CLIENT_ID,
                "grant_type": "password",
                "username": _ADMIN_USERNAME,
                "password": _ADMIN_PASSWORD,
            },
        )
        response.raise_for_status()
        body = response.json()
    return f"Bearer {body['access_token']}"
