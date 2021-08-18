"""OtApplication class."""
import logging
from pathlib import Path
import json
import os

logger = logging.getLogger(__name__)


class OtApplication:
    """Describe and manage the Opentrons application."""

    def __init__(self, config_path: Path) -> None:
        """Initialize the Application."""
        self.config_path: Path = config_path
        logger.info(f"config path = {self.config_path}")
        self.start_modtime: float = None
        self.read_config()

    def read_config(self) -> None:
        """Read the configuration file into a dictionary."""
        try:
            with open(self.config_path) as config_file:
                self.config = json.load(config_file)
        except Exception as exception:  # pylint: disable=W0703
            logger.exception(exception)
        self.start_modtime = os.path.getmtime(self.config_path)
        logger.info(f"config.json for the application\n{self.config}")

    def is_config_modified(self) -> None:
        """Has the config file been modified since the last time we loaded it?"""
        return self.start_modtime != os.path.getmtime(self.config_path)

    def write_config(self) -> None:
        """Write the config property to the config file.

        Then read the config file.
        """
        try:
            with open(self.config_path, "w") as config_file:
                # make it look like the format teh app uses
                data = json.dumps(self.config, indent=4).replace("    ", "\t")
                config_file.write(data)
        except Exception as exception:  # pylint: disable=W0703
            logger.exception(exception)
        self.read_config()
