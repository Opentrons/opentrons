"""Firmware update"""
from opentrons_hardware.drivers.can_bus import CanMessenger


class FirmwareUpdateInitiator:
    """Class that initiates a FW update."""

    def __init__(self, messenger: CanMessenger) -> None:
        """Constructor."""
        self._messenger = messenger
