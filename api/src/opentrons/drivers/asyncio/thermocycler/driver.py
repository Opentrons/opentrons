import asyncio
import logging
from enum import Enum
from typing import Optional, Dict

from opentrons.drivers import utils
from opentrons.drivers.command_builder import CommandBuilder
from opentrons.drivers.asyncio.communication.serial_connection import \
    SerialConnection, AsyncSerial
from opentrons.drivers.asyncio.thermocycler.abstract import AbstractThermocyclerDriver
from opentrons.drivers.types import Temperature, PlateTemperature, LidStatus

log = logging.getLogger(__name__)


class GCODE(str, Enum):
    OPEN_LID = "M126"
    CLOSE_LID = "M127"
    GET_LID_STATUS = "M119"
    SET_LID_TEMP = "M140"
    GET_LID_TEMP = "M141"
    EDIT_PID_PARAMS = "M301"
    SET_PLATE_TEMP = "M104"
    GET_PLATE_TEMP = "M105"
    SET_RAMP_RATE = "M566"
    DEACTIVATE_ALL = "M18"
    DEACTIVATE_LID = "M108"
    DEACTIVATE_BLOCK = "M14"
    DEVICE_INFO = "M115"


LID_TARGET_DEFAULT = 105    # Degree celsius (floats)
LID_TARGET_MIN = 37
LID_TARGET_MAX = 110
BLOCK_TARGET_MIN = 0
BLOCK_TARGET_MAX = 99
TEMP_UPDATE_RETRIES = 50
TEMP_BUFFER_MAX_LEN = 10


TC_BAUDRATE = 115200
TC_BOOTLOADER_BAUDRATE = 1200
# TODO (Laura 20190327) increased the thermocycler command timeout
# temporarily until we can change the firmware to asynchronously handle
# the lid being open and closed
SERIAL_ACK = '\r\n'
TC_COMMAND_TERMINATOR = SERIAL_ACK
TC_ACK = 'ok' + SERIAL_ACK + 'ok' + SERIAL_ACK
ERROR_KEYWORD = 'error'
DEFAULT_TC_TIMEOUT = 40
DEFAULT_COMMAND_RETRIES = 3
DEFAULT_STABILIZE_DELAY = 0.1
DEFAULT_POLLER_WAIT_SECONDS = 0.1
POLLING_FREQUENCY_MS = 1000
HOLD_TIME_FUZZY_SECONDS = POLLING_FREQUENCY_MS / 1000 * 5
TEMP_THRESHOLD = 0.3


class ThermocyclerError(Exception):
    pass


class ThermocyclerDriver(AbstractThermocyclerDriver):
    def __init__(self, connection: SerialConnection) -> None:
        """
        Constructor

        Args:
            connection: SerialConnection to the thermocycler
        """
        self._connection = connection

    async def connect(self) -> None:
        """Connect to thermocycler"""
        await self._connection.serial.open()

    async def disconnect(self) -> None:
        """Disconnect from thermocycler"""
        await self._connection.serial.close()

    async def is_connected(self) -> bool:
        """Check connection"""
        return await self._connection.serial.is_open()

    async def open_lid(self) -> None:
        """Send open lid command"""
        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.OPEN_LID
        )
        await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES)

    async def close_lid(self) -> None:
        """Send close lid command"""
        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.CLOSE_LID
        )
        await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES)

    async def get_lid_status(self) -> LidStatus:
        """Send get lid status command"""
        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.GET_LID_STATUS
        )
        response = await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES)
        return LidStatus(utils.parse_key_values(value=response)['Lid'])

    async def set_lid_temperature(self, temp: float) -> None:
        """Set the lid temperature"""
        temp = min(LID_TARGET_MAX, max(LID_TARGET_MIN, temp))
        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.SET_LID_TEMP
        ).add_float(
            prefix="S", value=temp, precision=utils.TC_GCODE_ROUNDING_PRECISION
        )
        await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES)

    async def get_lid_temperature(self) -> Temperature:
        """Send a get lid temperature command."""
        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.GET_LID_TEMP
        )
        response = await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES
        )
        return utils.parse_temperature_response(
            temperature_string=response, rounding_val=utils.TC_GCODE_ROUNDING_PRECISION)

    async def set_plate_temperature(
            self,
            temp: float,
            hold_time: Optional[float] = None,
            volume: Optional[float] = None) -> None:
        """Send set plate temperature command"""
        temp = min(BLOCK_TARGET_MAX, max(BLOCK_TARGET_MIN, temp))

        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.SET_PLATE_TEMP
        ).add_float(
            prefix="S", value=temp, precision=utils.TC_GCODE_ROUNDING_PRECISION
        )
        if hold_time is not None:
            c = c.add_float(prefix="H", value=hold_time,
                            precision=utils.TC_GCODE_ROUNDING_PRECISION)
        if volume is not None:
            c = c.add_float(prefix="V", value=volume,
                            precision=utils.TC_GCODE_ROUNDING_PRECISION)

        await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES)

    async def get_plate_temperature(self) -> PlateTemperature:
        """Send a get plate temperature command."""
        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.GET_PLATE_TEMP
        )
        response = await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES
        )
        return utils.parse_plate_temperature_response(
            temperature_string=response,
            rounding_val=utils.TC_GCODE_ROUNDING_PRECISION
        )

    async def set_ramp_rate(self, ramp_rate: float) -> None:
        """Send a set ramp rate command"""
        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.SET_RAMP_RATE
        ).add_float(
            prefix="S", value=ramp_rate, precision=utils.TC_GCODE_ROUNDING_PRECISION
        )
        await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES)

    async def deactivate_all(self) -> None:
        """Send deactivate all command."""
        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.DEACTIVATE_ALL
        )
        await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES)

    async def deactivate_lid(self) -> None:
        """Send deactivate lid command"""
        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.DEACTIVATE_LID
        )
        await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES)

    async def deactivate_block(self) -> None:
        """Send deactivate block command"""
        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.DEACTIVATE_BLOCK
        )
        await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES)

    async def get_device_info(self) -> Dict[str, str]:
        """Send get device info command"""
        c = CommandBuilder(
            terminator=SERIAL_ACK
        ).add_gcode(
            gcode=GCODE.DEVICE_INFO
        )
        response = await self._connection.send_command(
            data=c.build(), retries=DEFAULT_COMMAND_RETRIES)
        return utils.parse_device_information(
            device_info_string=response
        )

    async def enter_programming_mode(self) -> None:
        """Enter programming mode."""
        trigger_connection = await AsyncSerial.create(
            self._connection.port, TC_BOOTLOADER_BAUDRATE, timeout=1)
        await asyncio.sleep(0.05)
        await trigger_connection.close()
        await self._connection.serial.close()
