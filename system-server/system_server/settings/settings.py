"""System server configuration options."""

from functools import lru_cache
from typing import Annotated

from dotenv import load_dotenv, set_key
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

    dot_env_path: Annotated[
        str | None,
        Field(description="Path to a .env file to define system server settings."),
    ] = None
    model_config = SettingsConfigDict(env_prefix="OT_SYSTEM_SERVER_")


class SystemServerSettings(BaseSettings):
    """Robot server settings.

    To override any of these, create an environment variable with prefix
    OT_SYSTEM_SERVER_, e.g. OT_SYSTEM_SERVER_persistence_directory.
    """

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

    oem_mode_enabled: Annotated[
        bool | None,
        Field(
            description=(
                "A flag used to change the default splash screen on system startup."
                " If this flag is disabled (default), the Opentrons loading video will be shown."
                " If this flag is enabled but `oem_mode_splash_custom` is not set,"
                " then the default OEM Mode splash screen will be shown."
                " If this flag is enabled and `oem_mode_splash_custom` is set to a"
                " PNG filepath, the custom splash screen will be shown."
            ),
        ),
    ] = False

    oem_mode_splash_custom: Annotated[
        str | None,
        Field(
            description=(
                "The filepath of the PNG image used as the custom splash screen."
                " Read the description of the `oem_mode_enabled` flag to know how"
                " the splash screen changes when the flag is enabled/disabled."
            ),
        ),
    ] = None

    model_config = SettingsConfigDict(
        env_file=Environment().dot_env_path, env_prefix="OT_SYSTEM_SERVER_"
    )


def save_settings(settings: SystemServerSettings) -> bool:
    """Save the settings to the dotenv file."""
    env_path = Environment().dot_env_path
    env_path = env_path or f"{settings.persistence_directory}/system.env"
    prefix = settings.model_config.get("env_prefix")
    try:
        for key, val in settings.model_dump().items():
            name = f"{prefix}{key}"
            value = str(val) if val is not None else ""
            set_key(env_path, name, value)
        return True
    except (IOError, ValueError):
        return False
