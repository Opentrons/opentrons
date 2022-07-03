"""OtApplication class."""
import json
import os
from pathlib import Path
from typing import Optional

from rich.console import Console


class OtApplication:
    """Describe and manage the Opentrons application."""

    def __init__(self, config_path: Path, console: Console = Console()) -> None:
        """Initialize the Application."""
        self.config_path: Path = config_path
        self.console = console
        self.console.print("config path")
        self.console.print(self.config_path)
        self.start_modtime: Optional[float] = None
        self.read_config()

    def read_config(self) -> None:
        """Read the configuration file into a dictionary."""
        try:
            with open(self.config_path, encoding="utf-8") as config_file:
                self.config = json.load(config_file)
        except Exception:
            self.console.print_exception()
        self.start_modtime = os.path.getmtime(self.config_path)
        self.console.print("config.json for the application")
        self.console.print(self.config)

    def is_config_modified(self) -> bool:
        """Has the config file been modified since the last time we loaded it?."""
        return self.start_modtime != os.path.getmtime(self.config_path)

    def write_config(self) -> None:
        """Write the config property to the config file.

        Then read the config file.
        """
        try:
            with open(self.config_path, "w", encoding="utf-8") as config_file:
                # make it look like the format teh app uses
                data = json.dumps(self.config, indent=4).replace("    ", "\t")
                config_file.write(data)
        except Exception:
            self.console.print_exception()
        self.read_config()
