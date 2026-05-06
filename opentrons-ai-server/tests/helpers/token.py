import os

import httpx

from tests.helpers.settings import Settings
from tests.helpers.token_verifier import TokenVerifier


def fetch_token(token_url: str, client_id: str, client_secret: str, audience: str, grant_type: str) -> str:
    """Fetch an M2M access token from Auth0 using client credentials."""
    headers = {"Content-Type": "application/json"}
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "audience": audience,
        "grant_type": grant_type,
    }
    with httpx.Client() as client:
        response = client.post(token_url, headers=headers, json=data)
        response.raise_for_status()
        return str(response.json()["access_token"])


def request_user_token(
    token_url: str,
    client_id: str,
    client_secret: str,
    audience: str,
    username: str,
    password: str,
) -> httpx.Response:
    """Perform the Resource Owner Password token request; returns the response without raising.

    Callers can inspect response.status_code and response.json() / response.text.
    """
    headers = {"Content-Type": "application/json"}
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "audience": audience,
        "grant_type": "password",
        "username": username,
        "password": password,
        "scope": "openid profile email",
    }
    with httpx.Client() as client:
        return client.post(token_url, headers=headers, json=data)


def fetch_user_token(token_url: str, client_id: str, client_secret: str, audience: str, username: str, password: str) -> str:
    """Fetch a user access token from Auth0 via the Resource Owner Password grant.

    The Auth0 application identified by ``client_id`` must have the Password grant
    enabled.  Use this only for test users.
    """
    response = request_user_token(token_url, client_id, client_secret, audience, username, password)
    response.raise_for_status()
    return str(response.json()["access_token"])


class Token:
    def __init__(self, settings: Settings, refresh: bool = False) -> None:
        self.refresh: bool = refresh
        self.settings: Settings = settings
        self.value: str | None = None
        self.token_verifier = TokenVerifier(self.settings)
        self._set_token()

    def _read_cached(self) -> str:
        """Read the cached token from disk."""
        with open(self.settings.CACHED_TOKEN_PATH, "r") as file:
            return file.read().strip()

    def _set_token(self) -> None:
        """Retrieve or refresh the authentication token."""
        if self._is_token_cached():
            self.value = self._read_cached()
        if not self.value or self.refresh or not self.token_verifier.is_valid_token(self.value):
            token = fetch_token(
                self.settings.TOKEN_URL,
                self.settings.CLIENT_ID,
                self.settings.SECRET,
                self.settings.AUDIENCE,
                self.settings.GRANT_TYPE,
            )
            with open(self.settings.CACHED_TOKEN_PATH, "w") as file:
                file.write(token)
            self.value = token

    def _is_token_cached(self) -> bool:
        """Check if the token is cached."""
        return os.path.exists(self.settings.CACHED_TOKEN_PATH)
