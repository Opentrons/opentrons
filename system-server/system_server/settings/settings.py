"""System server configuration options."""

import typing
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


@lru_cache(maxsize=1)
def get_settings() -> "SystemServerSettings":
    """Get the settings."""
    env = Environment().dot_env_path
    if env:
        load_dotenv(env)

    return SystemServerSettings()


class Environment(BaseSettings):
    """Environment related settings."""

    dot_env_path: typing.Optional[str] = Field(
        default=None,
        description="Path to a .env file to define system server settings.",
    )
    model_config = SettingsConfigDict(env_prefix="OT_SYSTEM_SERVER_")


class SystemServerSettings(BaseSettings):
    """Robot server settings.

    To override any of these, create an environment variable with prefix
    OT_SYSTEM_SERVER_, e.g. OT_SYSTEM_SERVER_persistence_directory.
    """

    persistence_directory: typing.Optional[str] = Field(
        default=None,
        description=(
            "A directory for the server to store things persistently across boots."
            " If this directory doesn't already exist, the server will create it."
            " If this is the string `automatically_make_temporary`,"
            " the server will use a fresh temporary directory"
            " (effectively not persisting anything)."
        ),
    )

    model_config = SettingsConfigDict(
        env_file=Environment().dot_env_path, env_prefix="OT_SYSTEM_SERVER_"
    )
