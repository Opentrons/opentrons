"""Drivers for SOM gpio pins."""

from logging import getLogger
from time import sleep
from typing import Any, Optional
from unittest import mock

from typing_extensions import Final

from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    EngageEstop,
    EngageSyncOut,
    ReleaseEstop,
    ReleaseSyncOut,
)

CONSUMER_NAME_DEFAULT: Final[str] = "opentrons"
EEPROM_WP_OUT_GPIO_NAME: Final[str] = "SODIMM_222"

LOG = getLogger(__name__)


class RemoteOT3GPIO:
    """Driver class for OT3 gpio lines that are controlled remotely."""

    @staticmethod
    def _get_gpiod() -> Any:
        """Import the libgpiod bindings.

        If gpiod is not available, a mock will be used and the problem will be logged.
        """
        try:
            import gpiod  # type: ignore[import-not-found]

            return gpiod
        except ImportError:
            LOG.warning("could not import gpiod")
            return mock.MagicMock()

    def _get_usb_messenger(self) -> BinaryMessenger:
        return self._usb_messenger

    def __init__(
        self, usb_messenger: BinaryMessenger, consumer_name: Optional[str] = None
    ) -> None:
        """Create a diver for controlling gpio lines via a remote device."""
        self._consumer_name = consumer_name or CONSUMER_NAME_DEFAULT
        self._gpiod = self._get_gpiod()
        self._usb_messenger = usb_messenger
        self._eeprom_wp_out_line = self._gpiod.find_line(EEPROM_WP_OUT_GPIO_NAME)
        self._eeprom_wp_out_line.request(
            self._consumer_name, type=self._gpiod.LINE_REQ_DIR_OUT
        )
        self.deactivate_eeprom_wp()
        sleep(1)

    def __del__(self) -> None:
        try:
            self._eeprom_wp_out_line.release()
        except Exception:
            pass

    async def activate_estop(self) -> None:
        """Assert the emergency stop, which will disable all motors."""
        await self._get_usb_messenger().send(EngageEstop())

    async def deactivate_estop(self) -> None:
        """Stop asserting the emergency stop.

        If no other node is asserting estop, then motors can be enabled
        again.
        """
        await self._get_usb_messenger().send(ReleaseEstop())

    async def activate_nsync_out(self) -> None:
        """Assert the nsync out line."""
        await self._get_usb_messenger().send(EngageSyncOut())

    async def deactivate_nsync_out(self) -> None:
        """Stop asserting the nsync out line."""
        await self._get_usb_messenger().send(ReleaseSyncOut())

    def activate_eeprom_wp(self) -> None:
        """Assert the eeprom write protect, which will enable writes to the eeprom."""
        self._eeprom_wp_out_line.set_value(0)

    def deactivate_eeprom_wp(self) -> None:
        """Stop asserting the eeprom wp line."""
        self._eeprom_wp_out_line.set_value(1)
