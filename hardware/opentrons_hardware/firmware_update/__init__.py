"""Firmware update package."""

from typing import Type
from .initiator import (
    FirmwareUpdateInitiator,
)
from .downloader import FirmwareUpdateDownloader
from .hex_file import from_hex_file_path, from_hex_file, HexRecordProcessor
from .eraser import FirmwareUpdateEraser
from .run import RunUpdate
from .utils import check_firmware_updates, UpdateChecker


class FirmwareUpdate:
    """A class that bundles the free functions of the module for testability."""

    @property
    def update_runner(self) -> Type[RunUpdate]:
        """Interface to .run.RunUpdate."""
        return RunUpdate

    @property
    def update_checker(self) -> UpdateChecker:
        """Interface to check_firmware_updates."""
        return check_firmware_updates


__all__ = [
    "FirmwareUpdateDownloader",
    "FirmwareUpdateInitiator",
    "FirmwareUpdateEraser",
    "from_hex_file_path",
    "from_hex_file",
    "HexRecordProcessor",
    "RunUpdate",
    "check_firmware_updates",
    "FirmwareUpdate",
]
