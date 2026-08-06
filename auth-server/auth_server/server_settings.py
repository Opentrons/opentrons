"""Auth-server application settings, loaded from environment variables."""

import typing
from functools import lru_cache
from pathlib import Path

import typing_extensions
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from server_utils.settings_utils import get_dot_env_path

_ENV_PREFIX = "OT_AUTH_SERVER_"


@lru_cache(maxsize=1)
def get_settings() -> "AuthServerSettings":
    """Return the cached singleton settings instance."""
    return AuthServerSettings(_env_file=get_dot_env_path(_ENV_PREFIX))


class AuthServerSettings(BaseSettings):
    """Auth server settings.

    To override any of these create an environment variable with prefix
    ``OT_AUTH_SERVER_``, e.g. ``OT_AUTH_SERVER_persistence_directory``.
    """

    model_config = SettingsConfigDict(env_prefix=_ENV_PREFIX)
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
    alembic_config: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parent / "alembic.ini",
        description="Path to Alembic config file.",
        validation_alias="ALEMBIC_CONFIG",  # read ALEMBIC_CONFIG from env (no OT_ prefix)
    )

    audit_server_uds: str | None = Field(
        default=None,
        description=(
            "The path to the Unix domain socket where audit-server is listening."
            " This is mutually exclusive with audit_server_url."
            " If both are unset, audit logging cannot happen."
        ),
    )

    audit_server_url: str | None = Field(
        default=None,
        description=(
            "The base URL (e.g. `http://localhost:1234`) where audit-server is listening."
            " This is mutually exclusive with audit_server_uds."
            " If both are unset, audit logging cannot happen."
        ),
    )
