"""System server configuration options."""

from functools import lru_cache
from typing import Annotated

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from server_utils.settings_utils import get_dot_env_path

_ENV_PREFIX = "OT_SYSTEM_SERVER_"


@lru_cache(maxsize=1)
def get_settings() -> "SystemServerSettings":
    """Get the settings."""
    return SystemServerSettings(
        _env_file=get_dot_env_path(_ENV_PREFIX),  # type: ignore[call-arg]
    )


class SystemServerSettings(BaseSettings):
    """System server settings.

    To override any of these, create an environment variable with prefix
    ``OT_SYSTEM_SERVER_``, e.g. ``OT_SYSTEM_SERVER_persistence_directory``.
    """

    model_config = SettingsConfigDict(env_prefix=_ENV_PREFIX)

    persistence_directory: Annotated[
        str | None,
        Field(
            description=(
                "A directory for the server to store things persistently across boots."
                " If this directory doesn't already exist, the server will create it."
                " If this is the string `automatically_make_temporary`,"
                " the server will use a fresh temporary directory"
                " (effectively not persisting anything)."
            )
        ),
    ] = None
