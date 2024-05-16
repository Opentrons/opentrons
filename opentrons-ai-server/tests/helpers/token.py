import os

import httpx

from tests.helpers.settings import Settings
from tests.helpers.token_verifier import TokenVerifier


class Token:
    def __init__(self, settings: Settings, refresh: bool = False) -> None:
        self.refresh: bool = refresh
        self.settings: Settings = settings
        self.value: str | None = None
        self.token_verifier = TokenVerifier(self.settings)
        self._set_token()

    def _read_secret(self) -> str:
        """Read the client secret from a file."""
        with open(self.settings.CACHED_TOKEN_PATH, "r") as file:
            return file.read().strip()

    def _set_token(self) -> None:
        """Retrieve or refresh the authentication token."""
        if self._is_token_cached():
            self.value = self._read_secret()
        if not self.value or self.refresh or not self.token_verifier.is_valid_token(self.value):
            headers = {"Content-Type": "application/json"}
            data = {
                "client_id": self.settings.CLIENT_ID,
                "client_secret": self.settings.SECRET,
                "audience": self.settings.AUDIENCE,
                "grant_type": self.settings.GRANT_TYPE,
            }
            with httpx.Client() as client:
                response = client.post(self.settings.TOKEN_URL, headers=headers, json=data)
                response.raise_for_status()  # Raises exception for 4XX/5XX responses
                token = response.json()["access_token"]
                # cache the token
                with open(self.settings.CACHED_TOKEN_PATH, "w") as file:
                    file.write(token)
            self.value = token

    def _is_token_cached(self) -> bool:
        """Check if the token is cached."""
        return os.path.exists(self.settings.CACHED_TOKEN_PATH)
