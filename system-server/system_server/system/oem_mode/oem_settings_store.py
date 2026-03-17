"""Storage for settings related to OEM mode."""

import dataclasses
from pathlib import Path
from typing import Annotated, override

import dotenv
from fastapi import Depends
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource

from system_server.persistence import get_persistence_directory

# Note: This should match where external scripts will look.
_SETTINGS_FILE_NAME = "system.env"

_VARIABLE_NAME_PREFIX = "OT_SYSTEM_SERVER_"


@dataclasses.dataclass
class OEMSettings:
    """Settings related to OEM mode."""

    oem_mode_enabled: bool
    """A flag used to change the default splash screen on system startup.

    If this flag is disabled (default), the Opentrons loading video will be shown.
    If this flag is enabled but `oem_mode_splash_custom` is not set,
    then the default OEM Mode splash screen will be shown.
    If this flag is enabled and `oem_mode_splash_custom` is set to a
    PNG filepath, the custom splash screen will be shown.
    """

    oem_mode_splash_custom: str | None
    """The filepath of the PNG image used as the custom splash screen.

    Read the description of the `oem_mode_enabled` flag to know how
    the splash screen changes when the flag is enabled/disabled.
    """


class OEMSettingsStore:
    """An interface for reading and writing OEM settings on the filesystem."""

    def __init__(self, persistence_directory: Path) -> None:
        self._persistence_directory = persistence_directory

    def write(self, settings: OEMSettings) -> bool:
        """Save OEM settings to the filesystem.

        For historical reasons, the file format is "shell-ish," meaning roughly a bunch of
        key='value' lines.

        Practically, keys and values should contain absolutely no special shell characters.
        It will break the parsing in the external scripts, or the parsing here in Python, or both.
        See e.g. https://github.com/theskumar/python-dotenv/issues/543
        and https://github.com/theskumar/python-dotenv/issues/544.
        """
        file_path = self._persistence_directory / _SETTINGS_FILE_NAME

        # dotenv.set_key() claims it will fail if the file doesn't exist. It doesn't
        # actually (https://github.com/theskumar/python-dotenv/issues/480), but let's
        # make sure the file exists just in case.
        file_path.touch()

        try:
            # Sort for easier testing.
            sorted_kvs = sorted(
                dataclasses.asdict(settings).items(), key=lambda kv: kv[0]
            )
            for key, val in sorted_kvs:
                name = f"{_VARIABLE_NAME_PREFIX}{key}"
                value = str(val) if val is not None else ""
                dotenv.set_key(file_path, name, value)
            return True
        except (IOError, ValueError):
            return False

    def read(self) -> OEMSettings:
        """Read OEM settings from the filesystem."""
        read_model = _OEMSettingsReadModel(
            # _env_file is a special Pydantic argument that *is* documented,
            # but it seems the type hints don't have it.
            _env_file=self._persistence_directory / _SETTINGS_FILE_NAME  # type: ignore[call-arg]
        )
        return OEMSettings(
            oem_mode_enabled=read_model.oem_mode_enabled,
            oem_mode_splash_custom=read_model.oem_mode_splash_custom,
        )


async def get_oem_settings_store(
    persistence_directory: Annotated[Path, Depends(get_persistence_directory)],
) -> OEMSettingsStore:
    """A FastAPI dependency to return a store to let a request to read or write settings."""
    return OEMSettingsStore(persistence_directory)


class _OEMSettingsReadModel(BaseSettings):
    """A Pydantic model to help read OEM settings from their "shell-ish" file.

    We keep this internal to this module because it's easy to misuse. For example,
    Pydantic by default will read from .env in the cwd, instead of the file we actually want.
    """

    model_config = {
        "env_prefix": _VARIABLE_NAME_PREFIX,
        # Prior versions of this server commingled OEM settings with server launch settings
        # like OT_SYSTEM_SERVER_persistence_directory. Ignore those if they turn up.
        "extra": "ignore",
        # The write function serializes `foo=None` values as `foo=''`. Make sure those
        # get round-tripped back to `foo=None` when we parse them instead of `foo=''`.
        "env_ignore_empty": True,
    }

    @classmethod
    @override
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        """Do not read values from environment variables; read only from the file."""
        return (dotenv_settings,)

    # Note: These default values (used e.g. when the file doesn't exist)
    # need to stay in sync with the defaults used by external shell scripts.
    oem_mode_enabled: bool = False
    oem_mode_splash_custom: str | None = None
