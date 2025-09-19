import os
import typing
import dataclasses
from pathlib import Path, PurePosixPath
import logging
from .._logging_config import LOGGER_NAME


logger = logging.getLogger(LOGGER_NAME)

_ENV_VAR_PREFIX: typing.Final[str] = "OT_SYSTEM_RESOURCE_TRACKER"

ENABLED_ENV_VAR_NAME: typing.Final[str] = f"{_ENV_VAR_PREFIX}_ENABLED"
PROCESS_FILTERS_ENV_VAR_NAME: typing.Final[str] = f"{_ENV_VAR_PREFIX}_PROCESS_FILTERS"
REFRESH_INTERVAL_ENV_VAR_NAME: typing.Final[str] = f"{_ENV_VAR_PREFIX}_REFRESH_INTERVAL"
STORAGE_DIR_ENV_VAR_NAME: typing.Final[str] = f"{_ENV_VAR_PREFIX}_STORAGE_DIR"
LOGGING_LEVEL_ENV_VAR_NAME: typing.Final[str] = f"{_ENV_VAR_PREFIX}_LOGGING_LEVEL"


def default_filters() -> typing.Tuple[str, str]:
    """Get default filters."""
    return ("/opt/opentrons*", "python3*")


class EnvironmentParseError(Exception):
    """An error occurred while parsing an environment variable."""

    ...


def _eval_enabled(value: str) -> bool:
    """Parse the enabled environment variable.

    Returns:
        bool: The parsed value or None if the environment variable is not set.
    """
    if (coerced_enabled := value.lower()) not in ("true", "false"):
        raise EnvironmentParseError(
            f"{ENABLED_ENV_VAR_NAME} environment variable must be 'true' or 'false.' "
            f"You specified: {value}"
        )

    enabled = coerced_enabled == "true"
    logger.debug(f"Enabled: {enabled}")
    return enabled


def _eval_process_filters(value: str) -> typing.Tuple[str, ...]:
    """Parse the process filters environment variable.

    Returns:
        typing.Tuple[str, ...]: The parsed value or None if the environment variable is not set.
    """
    coerced_process_filters = tuple(
        [filter.strip() for filter in value.split(",") if filter.strip() != ""]
    )

    if len(coerced_process_filters) == 0:
        raise EnvironmentParseError(
            f"{PROCESS_FILTERS_ENV_VAR_NAME} environment variable must be a comma-separated list of process names (globbing is supported) to monitor. "
            f"You specified: {value}"
        )

    logger.debug(f"Process filters: {coerced_process_filters}")
    return coerced_process_filters


def _eval_refresh_interval(value: str) -> float:
    """Parse the refresh interval environment variable.

    Returns:
        float | None: The parsed value or None if the environment variable is not set.
    """
    try:
        coerced_refresh_interval = float(value)
    except ValueError:
        raise EnvironmentParseError(
            f"{REFRESH_INTERVAL_ENV_VAR_NAME} environment variable must be a number. "
            f"You specified: {value}"
        )

    if coerced_refresh_interval < 1.0:
        raise EnvironmentParseError(
            f"{REFRESH_INTERVAL_ENV_VAR_NAME} environment variable must be greater than or equal to 1.0. "
            f"You specified: {value}"
        )

    logger.debug(f"Refresh interval: {coerced_refresh_interval}")
    return coerced_refresh_interval


def _eval_storage_dir(value: str) -> PurePosixPath:
    """Parse the storage directory environment variable.

    Returns:
        PurePosixPath: The parsed value or None if the environment variable is not set.
    """
    coerced_storage_dir = PurePosixPath(value)

    if not coerced_storage_dir.is_absolute():
        raise EnvironmentParseError(
            f"{STORAGE_DIR_ENV_VAR_NAME} environment variable must be an absolute path to a directory.\n"
            f"You specified: {coerced_storage_dir}."
        )

    logger.debug(f"Storage dir: {coerced_storage_dir}")
    return coerced_storage_dir


def _eval_logging_level(value: str) -> str:
    """Parse the logging level environment variable.

    Returns:
        str: The parsed value or None if the environment variable is not set.
    """
    if value not in logging._nameToLevel:
        raise EnvironmentParseError(
            f"{LOGGING_LEVEL_ENV_VAR_NAME} environment variable must be one of {list(logging._nameToLevel.keys())}. "
            f"You specified: {value}"
        )

    logger.debug(f"Logging level: {value}")
    return value


@dataclasses.dataclass(frozen=True)
class SystemResourceTrackerConfiguration:
    """Environment variables for the system resource tracker."""

    enabled: bool = False
    process_filters: typing.Tuple[str, ...] = dataclasses.field(
        default_factory=default_filters
    )
    refresh_interval: float = 10.0
    storage_dir: Path = Path("/data/performance_metrics_data/")
    logging_level: str = "INFO"

    def __str__(self) -> str:
        """Get a string representation of the configuration."""
        return (
            "\n"
            f"enabled={self.enabled}\n"
            f"process_filters={self.process_filters}\n"
            f"refresh_interval={self.refresh_interval}\n"
            f"storage_dir={self.storage_dir}\n"
            f"logging_level={self.logging_level}\n"
        )

    @classmethod
    def from_env(cls) -> "SystemResourceTrackerConfiguration":
        """Create a SystemResourceTrackerConfiguration instance from environment variables.

        Returns:
            SystemResourceTrackerConfiguration: An instance of SystemResourceTrackerConfiguration.
        """
        kwargs: typing.Dict[str, typing.Any] = {}

        if (enabled := os.environ.get(ENABLED_ENV_VAR_NAME)) is not None:
            kwargs["enabled"] = _eval_enabled(enabled)

        if (
            process_filters := os.environ.get(PROCESS_FILTERS_ENV_VAR_NAME)
        ) is not None:
            kwargs["process_filters"] = _eval_process_filters(process_filters)

        if (
            refresh_interval := os.environ.get(REFRESH_INTERVAL_ENV_VAR_NAME)
        ) is not None:
            kwargs["refresh_interval"] = _eval_refresh_interval(refresh_interval)

        if (storage_dir := os.environ.get(STORAGE_DIR_ENV_VAR_NAME)) is not None:
            kwargs["storage_dir"] = _eval_storage_dir(storage_dir)

        if (logging_level := os.environ.get(LOGGING_LEVEL_ENV_VAR_NAME)) is not None:
            kwargs["logging_level"] = _eval_logging_level(logging_level)

        return cls(**kwargs)
