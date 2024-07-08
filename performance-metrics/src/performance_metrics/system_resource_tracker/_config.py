import os
import typing
import dataclasses
from pathlib import Path, PurePosixPath
import logging


logger = logging.getLogger(__name__)


def default_filters() -> typing.Tuple[str, str]:
    """Get default filters."""
    return ("/opt/opentrons*", "python3*")


@dataclasses.dataclass(frozen=True)
class SystemResourceTrackerConfiguration:
    """Environment variables for the system resource tracker."""

    SHOULD_TRACK_ENV_VAR_NAME: typing.Final[str] = "OT_SYSTEM_RESOURCE_TRACKER_ENABLED"
    PROCESS_FILTERS_ENV_VAR_NAME: typing.Final[
        str
    ] = "OT_SYSTEM_RESOURCE_TRACKER_PROCESS_FILTERS"
    REFRESH_INTERVAL_ENV_VAR_NAME: typing.Final[
        str
    ] = "OT_SYSTEM_RESOURCE_TRACKER_REFRESH_INTERVAL"
    STORAGE_DIR_ENV_VAR_NAME: typing.Final[
        str
    ] = "OT_SYSTEM_RESOURCE_TRACKER_STORAGE_DIR"
    LOGGING_LEVEL_ENV_VAR_NAME: typing.Final[
        str
    ] = "OT_SYSTEM_RESOURCE_TRACKER_LOGGING_LEVEL"

    should_track: bool = False
    process_filters: typing.Tuple[str, ...] = dataclasses.field(
        default_factory=default_filters
    )
    refresh_interval: float = 10.0
    storage_dir: Path = Path("/data/performance_metrics_data/")
    logging_level: str = "INFO"

    @staticmethod
    def log_missing_env_var(env_var: str) -> None:
        """Log a warning if an environment variable is missing.

        Args:
            env_var (str): The name of the missing environment variable.
        """
        logger.warning(
            f"Environment variable {env_var} is not set. Using default value."
        )

    @classmethod
    def parse_should_track(cls) -> bool | None:
        """Parse the should track environment variable.

        Returns:
            bool | None: The parsed value or None if the environment variable is not set.
        """
        should_track_env_var = os.environ.get(cls.SHOULD_TRACK_ENV_VAR_NAME)

        if should_track_env_var is None:
            cls.log_missing_env_var(cls.SHOULD_TRACK_ENV_VAR_NAME)
            return None

        coerced_should_track = should_track_env_var.lower() == "true"
        logger.info(f"Should track: {coerced_should_track}")
        return coerced_should_track

    @classmethod
    def parse_process_filters(cls) -> typing.Tuple[str, ...] | None:
        """Parse the process filters environment variable.

        Returns:
            typing.Tuple[str, ...] | None: The parsed value or None if the environment variable is not set.
        """
        process_filters_env_var = os.environ.get(cls.PROCESS_FILTERS_ENV_VAR_NAME)

        if process_filters_env_var is None:
            cls.log_missing_env_var(cls.PROCESS_FILTERS_ENV_VAR_NAME)
            return None

        coerced_process_filters = tuple(
            [
                filter.strip()
                for filter in process_filters_env_var.split(",")
                if filter.strip() != ""
            ]
        )

        if len(coerced_process_filters) == 0:
            logger.warning(
                f"{cls.PROCESS_FILTERS_ENV_VAR_NAME} environment variable must be a comma-separated list of process names to monitor. Globbing is supported. Using default value."
            )
            return None

        logger.debug(f"Process filters: {coerced_process_filters}")
        return coerced_process_filters

    @classmethod
    def parse_refresh_interval(cls) -> float | None:
        """Parse the refresh interval environment variable.

        Returns:
            float | None: The parsed value or None if the environment variable is not set.
        """
        refresh_interval = os.environ.get(cls.REFRESH_INTERVAL_ENV_VAR_NAME)

        if refresh_interval is None:
            cls.log_missing_env_var(cls.REFRESH_INTERVAL_ENV_VAR_NAME)
            return None

        try:
            coerced_refresh_interval = float(refresh_interval)
        except ValueError:
            logger.warning(
                f"{cls.REFRESH_INTERVAL_ENV_VAR_NAME} environment variable must be a number. Using default value."
            )
            return None

        coerced_refresh_interval = float(refresh_interval)

        if coerced_refresh_interval < 1.0:
            logger.warning(
                f"{cls.REFRESH_INTERVAL_ENV_VAR_NAME} environment variable must be greater than or equal to 1.0. Using default value."
            )
            return None

        logger.debug(f"Refresh interval: {coerced_refresh_interval}")
        return coerced_refresh_interval

    @classmethod
    def parse_storage_dir(cls) -> PurePosixPath | None:
        """Parse the storage directory environment variable.

        Returns:
            PurePosixPath | None: The parsed value or None if the environment variable is not set.
        """
        storage_dir = os.environ.get(cls.STORAGE_DIR_ENV_VAR_NAME)

        if storage_dir is None:
            cls.log_missing_env_var(cls.STORAGE_DIR_ENV_VAR_NAME)
            return None

        coerced_storage_dir = PurePosixPath(storage_dir)

        if not coerced_storage_dir.is_absolute():
            logger.warning(
                f"{cls.STORAGE_DIR_ENV_VAR_NAME} environment variable must be an absolute path to a directory.\n"
                f"You specified: {coerced_storage_dir}.\n"
                f"Is absolute: {coerced_storage_dir.is_absolute()}.\n"
                "Using default value."
            )
            return None

        logger.debug(f"Storage dir: {coerced_storage_dir}")
        return coerced_storage_dir

    @classmethod
    def parse_logging_level(cls) -> str | None:
        """Parse the logging level environment variable.

        Returns:
            str | None: The parsed value or None if the environment variable is not set.
        """
        logging_level = os.environ.get(cls.LOGGING_LEVEL_ENV_VAR_NAME)

        if logging_level is None:
            cls.log_missing_env_var(cls.LOGGING_LEVEL_ENV_VAR_NAME)
            return None

        if logging_level not in logging._nameToLevel:
            logger.warning(
                f"{cls.LOGGING_LEVEL_ENV_VAR_NAME} environment variable must be one of {list(logging._nameToLevel.keys())}. Using default value."
            )
            return None

        logger.setLevel(logging._nameToLevel[logging_level])

        logger.debug(f"Logging level: {logging_level}")
        return logging_level

    @classmethod
    def from_env(cls) -> "SystemResourceTrackerConfiguration":
        """Create a SystemResourceTrackerConfiguration instance from environment variables.

        Returns:
            SystemResourceTrackerConfiguration: An instance of SystemResourceTrackerConfiguration.
        """
        kwargs: typing.Dict[str, typing.Any] = {}

        # If using default do not add to kwargs

        should_track = cls.parse_should_track()
        process_filters = cls.parse_process_filters()
        refresh_interval = cls.parse_refresh_interval()
        storage_dir = cls.parse_storage_dir()
        logging_level = cls.parse_logging_level()

        if should_track is not None:
            kwargs["should_track"] = should_track
        if process_filters is not None:
            kwargs["process_filters"] = process_filters
        if refresh_interval is not None:
            kwargs["refresh_interval"] = refresh_interval
        if storage_dir is not None:
            kwargs["storage_dir"] = storage_dir
        if logging_level is not None:
            kwargs["logging_level"] = logging_level

        return cls(**kwargs)

    def to_env(self) -> None:
        """Set the environment variables for the system resource tracker."""
        os.environ[self.SHOULD_TRACK_ENV_VAR_NAME] = str(self.should_track).lower()
        os.environ[self.PROCESS_FILTERS_ENV_VAR_NAME] = ",".join(self.process_filters)
        os.environ[self.REFRESH_INTERVAL_ENV_VAR_NAME] = str(self.refresh_interval)
        os.environ[self.STORAGE_DIR_ENV_VAR_NAME] = str(self.storage_dir)
        os.environ[self.LOGGING_LEVEL_ENV_VAR_NAME] = self.logging_level

    def logging_level_update_needed(
        self, new_config: "SystemResourceTrackerConfiguration"
    ) -> bool:
        """Check if the logging level needs to be updated.

        Args:
            new_config (SystemResourceTrackerConfiguration): The new configuration to compare with.

        Returns:
            bool: True if the logging level needs to be updated, False otherwise.
        """
        return self.logging_level != new_config.logging_level
