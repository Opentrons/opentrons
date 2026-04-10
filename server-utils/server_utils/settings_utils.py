"""Shared helpers for server settings."""

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def get_dot_env_path(env_prefix: str) -> str | None:
    """Return the ``.env`` file path for the given server, or ``None``.

    Each server can opt into loading a ``.env`` file by setting
    ``<env_prefix>dot_env_path`` (e.g. ``OT_AUTH_SERVER_dot_env_path``).
    When unset, no ``.env`` file is loaded and all settings come from
    environment variables or their defaults.

    If a path is found, ``load_dotenv`` is called so the values are
    available to anything that reads ``os.environ`` directly.
    """

    class _Environment(BaseSettings):
        """Reads ``<env_prefix>dot_env_path`` from the process environment."""

        dot_env_path: str | None = Field(
            default=None,
            description="Path to a .env file to load server settings from.",
        )
        model_config = SettingsConfigDict(env_prefix=env_prefix)

    path = _Environment().dot_env_path
    if path:
        load_dotenv(path)
    return path
