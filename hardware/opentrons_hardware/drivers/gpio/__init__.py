"""Drivers for SOM gpio pins."""
from typing import Any, Optional
from typing_extensions import Final
from unittest import mock
from logging import getLogger
from time import sleep
from opentrons_hardware.drivers.binary_usb import BinaryMessenger
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    EngageEstop,
    ReleaseEstop,
    EngageSyncOut,
    ReleaseSyncOut,
)

CONSUMER_NAME_DEFAULT: Final[str] = "opentrons"
ESTOP_OUT_GPIO_NAME: Final[str] = "SODIMM_210"
NSYNC_OUT_GPIO_NAME: Final[str] = "SODIMM_206"
EEPROM_WP_OUT_GPIO_NAME: Final[str] = "SODIMM_222"

LOG = getLogger(__name__)


class OT3GPIO:
    """Driver class for OT3 gpio lines."""

    @staticmethod
    def _get_gpiod() -> Any:
        """Import the libgpiod bindings.

        If gpiod is not available, a mock will be used and the problem will be logged.
        """
        try:
            import gpiod  # type: ignore[import]

            return gpiod
        except ImportError:
            LOG.warning("could not import gpiod")
            return mock.MagicMock()

    def __init__(self, consumer_name: Optional[str] = None) -> None:
        """Build the GPIO handler.

        If a consumer name is provided (which can add more semantic information to
        other programs trying to find out who holds a line) then it will be used;
        otherwise, the default is opentrons.
        """
        self._consumer_name = consumer_name or CONSUMER_NAME_DEFAULT
        self._gpiod = self._get_gpiod()
        self._estop_out_line = self._gpiod.find_line(ESTOP_OUT_GPIO_NAME)
        self._estop_out_line.request(
            self._consumer_name, type=self._gpiod.LINE_REQ_DIR_OUT
        )
        self._nsync_out_line = self._gpiod.find_line(NSYNC_OUT_GPIO_NAME)
        self._nsync_out_line.request(
            self._consumer_name, type=self._gpiod.LINE_REQ_DIR_OUT
        )
        self._eeprom_wp_out_line = self._gpiod.find_line(EEPROM_WP_OUT_GPIO_NAME)
        self._eeprom_wp_out_line.request(
            self._consumer_name, type=self._gpiod.LINE_REQ_DIR_OUT
        )
        self.deactivate_estop()
        self.deactivate_nsync_out()
        self.deactivate_eeprom_wp()
        sleep(1)

    def activate_estop(self) -> None:
        """Assert the emergency stop, which will disable all motors."""
        self._estop_out_line.set_value(0)

    def deactivate_estop(self) -> None:
        """Stop asserting the emergency stop.

        If no other node is asserting estop, then motors can be enabled
        again.
        """
        self._estop_out_line.set_value(1)

    def activate_nsync_out(self) -> None:
        """Assert the nsync out line."""
        self._nsync_out_line.set_value(0)

    def deactivate_nsync_out(self) -> None:
        """Stop asserting the nsync out line."""
        self._nsync_out_line.set_value(1)

    def activate_eeprom_wp(self) -> None:
        """Assert the eeprom write protect, which will enable writes to the eeprom."""
        self._eeprom_wp_out_line.set_value(0)

    def deactivate_eeprom_wp(self) -> None:
        """Stop asserting the eeprom wp line."""
        self._eeprom_wp_out_line.set_value(1)


class RemoteOT3GPIO:
    """Driver class for OT3 gpio lines that are controlled remotely."""

    def _get_usb_messenger(self) -> Any:
        if self._usb_messenger is not None:
            return self._usb_messenger
        else:
            LOG.warning("Remote gpio control not connected")
            return mock.MagicMock()

    def __init__(self, usb_messenger: Optional[BinaryMessenger]) -> None:
        """Create a diver for controlling gpio lines via a remote device."""
        self._usb_messenger = usb_messenger

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
