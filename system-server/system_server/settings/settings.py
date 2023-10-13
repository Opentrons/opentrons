"""System server configuration options."""
import typing
import logging
from functools import lru_cache

from pydantic import BaseSettings, Field
from dotenv import load_dotenv

log = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_settings() -> "SystemServerSettings":
    """Get the settings."""
    update_from_dotenv()
    return SystemServerSettings()


def update_from_dotenv() -> None:
    """Get the location of the settings file."""
    env = Environment().dot_env_path
    if env:
        load_dotenv(env)


class Environment(BaseSettings):
    """Environment related settings."""

    dot_env_path: typing.Optional[str] = Field(
        None, description="Path to a .env file to define system server settings."
    )

    class Config:
        """Prefix configuration for environment variables."""

        env_prefix = "OT_SYSTEM_SERVER_"


# If you update this, also update the generated settings_schema.json.
class SystemServerSettings(BaseSettings):
    """Robot server settings.

    To override any of these create an environment variable with prefix
    OT_SYSTEM_SERVER_.
    """

    persistence_directory: typing.Optional[str] = Field(
        None,
        description=(
            "A directory for the server to store things persistently across boots."
            " If this directory doesn't already exist, the server will create it."
            " If this is the string `automatically_make_temporary`,"
            " the server will use a fresh temporary directory"
            " (effectively not persisting anything)."
        ),
    )

    log_level: str = Field(
        default="INFO",
        description="The log level for the system server logs",
    )

    class Config:
        """Prefix configuration for environment variables."""

        env_prefix = "OT_SYSTEM_SERVER_"
