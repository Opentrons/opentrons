"""Auth-server application settings, loaded from environment variables."""

import typing
from functools import lru_cache
from pathlib import Path

import typing_extensions
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


@lru_cache(maxsize=1)
def get_settings() -> "AuthServerSettings":
    """Return the cached singleton settings instance."""
    return AuthServerSettings()


class AuthServerSettings(BaseSettings):
    """Auth server settings.

    To override any of these create an environment variable with prefix
    ``OT_AUTH_SERVER_``, e.g. ``OT_AUTH_SERVER_persistence_directory``.
    """

    model_config = SettingsConfigDict(env_prefix="OT_AUTH_SERVER_")

    persistence_directory: typing.Union[
        typing_extensions.Literal["automatically_make_temporary"],
        Path,
    ] = Field(
        default="automatically_make_temporary",
        description=(
            "A directory for the server to store things persistently across boots."
            " If this directory doesn't already exist, the server will create it."
            " If this is the string `automatically_make_temporary`,"
            " the server will use a fresh temporary directory"
            " (effectively not persisting anything)."
        ),
    )
