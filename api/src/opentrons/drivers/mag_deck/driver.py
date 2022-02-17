"""
- This driver is responsible for providing an interface for the mag deck
- The driver is the only system component that knows about the mag-deck's
  GCODES or how the mag-deck communicates

- The driver is NOT responsible for interpreting deck states in any way
  or knowing anything about what the device is being used for
"""

from __future__ import annotations

import asyncio
import logging
from typing import Dict, Optional
from enum import Enum

from opentrons.drivers import utils
from opentrons.drivers.command_builder import CommandBuilder
from opentrons.drivers.asyncio.communication import SerialConnection
from .abstract import AbstractMagDeckDriver

log = logging.getLogger(__name__)

DEFAULT_MAG_DECK_TIMEOUT = 10  # Quite large to account for probe time

DEFAULT_COMMAND_RETRIES = 3


class GCODE(str, Enum):
    HOME = "G28.2"
    PROBE_PLATE = "G38.2"
    GET_PLATE_HEIGHT = "M836"
    GET_CURRENT_POSITION = "M114.2"
    MOVE = "G0"
    DEVICE_INFO = "M115"
    PROGRAMMING_MODE = "dfu"


MAG_DECK_BAUDRATE = 115200

MAG_DECK_COMMAND_TERMINATOR = "\r\n\r\n"
MAG_DECK_ACK = "ok\r\nok\r\n"


# Number of digits after the decimal point for millimeter values
# being sent to/from magnetic module
GCODE_ROUNDING_PRECISION = 3


class MagDeckError(Exception):
    pass


class MagDeckDriver(AbstractMagDeckDriver):
    @classmethod
    async def create(
        cls, port: str, loop: Optional[asyncio.AbstractEventLoop] = None
    ) -> MagDeckDriver:
        """
        Create a mag deck driver.

        Args:
            port: port or url of magdeck
            loop: optional event loop

        Returns: driver
        """
        connection = await SerialConnection.create(
            port=port,
            baud_rate=MAG_DECK_BAUDRATE,
            timeout=DEFAULT_MAG_DECK_TIMEOUT,
            ack=MAG_DECK_ACK,
            loop=loop,
            reset_buffer_before_write=False,
        )
        return cls(connection=connection)

    def __init__(self, connection: SerialConnection):
        """
        Constructor

        Args:
            connection: connection to magdeck.
        """
        self._connection = connection

    async def connect(self) -> None:
        """Connect to device"""
        await self._connection.open()

    async def disconnect(self) -> None:
        """Disconnect from device"""
        await self._connection.close()

    async def is_connected(self) -> bool:
        """Check if connected."""
        return await self._connection.is_open()

    async def home(self) -> None:
        """Homes the magnet"""
        c = CommandBuilder(terminator=MAG_DECK_COMMAND_TERMINATOR).add_gcode(
            gcode=GCODE.HOME
        )
        await self._send_command(c)

    async def probe_plate(self) -> None:
        """
        Probes for the deck plate and calculates the plate distance
        from home.
        To be used for calibrating MagDeck
        """
        c = CommandBuilder(terminator=MAG_DECK_COMMAND_TERMINATOR).add_gcode(
            gcode=GCODE.PROBE_PLATE
        )
        await self._send_command(c)

    async def get_plate_height(self) -> float:
        """
        Default plate_height for the device is 30;
        calculated as MAX_TRAVEL_DISTANCE(45mm) - 15mm
        """
        c = CommandBuilder(terminator=MAG_DECK_COMMAND_TERMINATOR).add_gcode(
            gcode=GCODE.GET_PLATE_HEIGHT
        )
        response = await self._send_command(c)
        data = utils.parse_key_values(response)
        return utils.parse_number(str(data.get("height")), GCODE_ROUNDING_PRECISION)

    async def get_mag_position(self) -> float:
        """
        Default mag_position for the device is 0.0
        i.e. it boots with the current position as 0.0
        """
        c = CommandBuilder(terminator=MAG_DECK_COMMAND_TERMINATOR).add_gcode(
            gcode=GCODE.GET_CURRENT_POSITION
        )

        response = await self._send_command(c)
        data = utils.parse_key_values(response)
        return utils.parse_number(str(data.get("Z")), GCODE_ROUNDING_PRECISION)

    async def move(self, position: float) -> None:
        """
        Move the magnets along Z axis where the home position is 0.0;
        position-> a point along Z. Does not self-check if the position
        is outside of the deck's linear range

        The units of position depend on the module model.
        For GEN1, it's half millimeters ("short millimeters").
        For GEN2, it's millimeters.
        """
        c = (
            CommandBuilder(terminator=MAG_DECK_COMMAND_TERMINATOR)
            .add_gcode(gcode=GCODE.MOVE)
            .add_float(prefix="Z", value=position, precision=GCODE_ROUNDING_PRECISION)
        )
        await self._send_command(c)

    async def get_device_info(self) -> Dict[str, str]:
        """
        Queries Mag-Deck for it's build version, model, and serial number

        Returns: dict
            Where keys are the strings 'version', 'model', and 'serial',
            and each value is a string identifier

            {
                'serial': '1aa11bb22',
                'model': '1aa11bb22',
                'version': '1aa11bb22'
            }

        Example input from Mag-Deck's serial response:
            "serial:aa11bb22 model:aa11bb22 version:aa11bb22"
        """
        c = CommandBuilder(terminator=MAG_DECK_COMMAND_TERMINATOR).add_gcode(
            gcode=GCODE.DEVICE_INFO
        )
        response = await self._send_command(c)
        return utils.parse_device_information(device_info_string=response)

    async def enter_programming_mode(self) -> None:
        """
        Enters and stays in DFU mode for 8 seconds.
        The module resets upon exiting the mode
        which causes the robot to lose serial connection to it.
        The connection can be restored by performing a .disconnect()
        followed by a .connect() to the same symlink node
        """
        c = CommandBuilder(terminator=MAG_DECK_COMMAND_TERMINATOR).add_gcode(
            gcode=GCODE.PROGRAMMING_MODE
        )
        await self._send_command(c)

    async def _send_command(self, command: CommandBuilder) -> str:
        """
        Send the command

        Args:
            command: command to send

        Returns:
            command response
        """
        response = await self._connection.send_command(
            command=command, retries=DEFAULT_COMMAND_RETRIES
        )
        return response
