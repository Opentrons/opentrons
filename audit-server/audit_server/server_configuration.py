"""Audit-server application configuration, loaded from environment variables."""

import typing
from functools import lru_cache
from pathlib import Path

import typing_extensions
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from server_utils.settings_utils import get_dot_env_path

_ENV_PREFIX = "OT_AUDIT_SERVER_"


@lru_cache(maxsize=1)
def get_configuration() -> "AuditServerConfiguration":
    """Return the cached singleton configuration instance."""
    return AuditServerConfiguration(_env_file=get_dot_env_path(_ENV_PREFIX))


class AuditServerConfiguration(BaseSettings):
    """Audit server configuration.

    To override any of these create an environment variable with prefix
    ``OT_AUDIT_SERVER_``, e.g. ``OT_AUDIT_SERVER_persistence_directory``.
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
    key_server_uds: str | None = Field(
        default=None,
        description=(
            "The path to the Unix domain socket where key-server is listening."
            " This is mutually exclusive with key_server_url."
            " If both are unset, audit log messages cannot be signed and any"
            " request that requires the key-server client will fail."
        ),
    )
    key_server_url: str | None = Field(
        default=None,
        description=(
            "The base URL (e.g. `http://localhost:33960`) where key-server is listening."
            " This is mutually exclusive with key_server_uds."
            " If both are unset, audit log messages cannot be signed and any"
            " request that requires the key-server client will fail."
        ),
    )
