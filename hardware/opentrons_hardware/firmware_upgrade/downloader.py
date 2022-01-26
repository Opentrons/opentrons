"""Firmware upgrade."""
from opentrons_hardware.drivers.can_bus import CanMessenger


class FirmwareUpgradeDownloader:
    """Class that performs a FW upgrade using CAN messages."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor."""
        self._messenger = messenger

