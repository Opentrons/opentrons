import asyncio
import re
from typing import Optional

from opentrons.drivers.asyncio.communication import AsyncResponseSerialConnection
from .abstract import AbstractVacuumModuleDriver
from .types import LEDColor, LEDPattern, GCODE, VacuumModuleInfo, HardwareRevision
from .errors import VacuumModuleErrorCodes


VM_BAUDRATE = 115200
DEFAULT_VM_TIMEOUT = 5
VM_MOVE_TIMEOUT = 20
VM_TOF_TIMEOUT = 20
VM_TOF_FRAME_RETRIES = 1
VM_TOF_INIT_TIMEOUT = 5
VM_ACK = "OK\n"
VM_ERROR_KEYWORD = "err"
VM_ASYNC_ERROR_ACK = "async"
DEFAULT_COMMAND_RETRIES = 2
GCODE_ROUNDING_PRECISION = 2

# LED animation range values
MIN_DURATION_MS = 25  # 25ms
MAX_DURATION_MS = 10000  # 10s
MAX_REPS = 10


class VacuumModuleDriver(AbstractVacuumModuleDriver):
    """Driver for Opentrons Vacuum Module."""

    @classmethod
    def parse_device_info(cls, response: str) -> VacuumModuleInfo:
        """Parse vacuum module info."""
        _RE = re.compile(
            f"^{GCODE.GET_DEVICE_INFO} FW:(?P<fw>\\S+) HW:Opentrons-vacuum-module-(?P<hw>\\S+) SerialNo:(?P<sn>\\S+)$"
        )
        m = _RE.match(response)
        if not m:
            raise ValueError(f"Incorrect Response for device info: {response}")
        return VacuumModuleInfo(
            m.group("fw"), HardwareRevision(m.group("hw")), m.group("sn")
        )

    @classmethod
    def parse_reset_reason(cls, response: str) -> int:
        """Parse the reset reason"""
        _RE = re.compile(rf"^{GCODE.GET_RESET_REASON} R:(?P<R>\d)$")
        match = _RE.match(response)
        if not match:
            raise ValueError(f"Incorrect Response for reset reason: {response}")
        return int(match.group("R"))

    @classmethod
    def parse_installation_detected(cls, response: str) -> bool:
        """Parse install detection."""
        _RE = re.compile(rf"^{GCODE.GET_INSTALL_DETECTED} I:(\d)$")
        match = _RE.match(response)
        if not match:
            raise ValueError(
                f"Incorrect Response for installation detected: {response}"
            )
        return bool(int(match.group(1)))

    @classmethod
    def parse_estop_engaged(cls, response: str) -> bool:
        """Parse estop enagaged."""
        _RE = re.compile(rf"^{GCODE.GET_ESTOP_ENGAGED} E:(\d)$")
        match = _RE.match(response)
        if not match:
            raise ValueError(f"Incorrect Response for Estop engaged: {response}")
        return bool(int(match.group(1)))

    @classmethod
    async def create(
        cls, port: str, loop: Optional[asyncio.AbstractEventLoop]
    ) -> "VacuumModuleDriver":
        """Create a Vacuum Module driver."""
        connection = await AsyncResponseSerialConnection.create(
            port=port,
            baud_rate=VM_BAUDRATE,
            timeout=DEFAULT_VM_TIMEOUT,
            number_of_retries=DEFAULT_COMMAND_RETRIES,
            ack=VM_ACK,
            loop=loop,
            error_keyword=VM_ERROR_KEYWORD,
            async_error_ack=VM_ASYNC_ERROR_ACK,
            reset_buffer_before_write=True,
            error_codes=VacuumModuleErrorCodes,
        )
        return cls(connection)

    def __init__(self, connection: AsyncResponseSerialConnection) -> None:
        """
        Constructor

        Args:
            connection: connection to the vacuum module
        """
        self._connection = connection

    async def connect(self) -> None:
        """Connect to vacuum module."""
        await self._connection.open()

    async def disconnect(self) -> None:
        """Disconnect from vacuum module."""
        await self._connection.close()

    async def is_connected(self) -> bool:
        """Check connection to vacuum module."""
        return await self._connection.is_open()

    async def get_device_info(self) -> VacuumModuleInfo:
        """Get Device Info."""
        response = await self._connection.send_command(
            GCODE.GET_DEVICE_INFO.build_command()
        )
        device_info = self.parse_device_info(response)
        reason_resp = await self._connection.send_command(
            GCODE.GET_RESET_REASON.build_command()
        )
        reason = self.parse_reset_reason(reason_resp)
        device_info.rr = reason
        return device_info

    async def set_serial_number(self, sn: str) -> None:
        """Set Serial Number."""
        if not re.match(r"^FST[\w]{1}[\d]{2}[\d]{8}[\d]+$", sn):
            raise ValueError(
                f"Invalid serial number: ({sn}) expected format: VMTA1020250119001"
            )
        resp = await self._connection.send_command(
            GCODE.SET_SERIAL_NUMBER.build_command().add_element(sn)
        )
        if not re.match(rf"^{GCODE.SET_SERIAL_NUMBER}$", resp):
            raise ValueError(f"Incorrect Response for set serial number: {resp}")

    async def enable_pump(self) -> None:
        """Enables the vacuum pump, does not turn it on."""
        ...

    async def disable_pump(self) -> None:
        """Disable the vacuum pump, doesn't just turn it off."""
        ...

    # Are these register addresses configurable ?? Should I add setters for them too?
    async def get_pump_motor_register(self) -> None:
        """Get the register value of the pump motor driver."""
        ...

    async def get_pressure_sensor_register(self) -> None:
        """Get the register value of the pressure sensor driver."""
        ...

    async def get_pressure_sensor_reading(self) -> float:
        """Get a reading from the pressure sensor."""
        return 0.0

    async def get_guage_pressure_reading(self) -> float:
        """Read each pressure sensor and return the difference."""
        return 0.0

    # TODO: update the pressure arg with the units when we find out which unit
    async def set_vacuum_chamber_pressure(
        self,
        guage_pressure_mbar: float,
        duration: Optional[float],
        rate: Optional[float],
    ) -> None:
        """Engage or release the vacuum until a desired internal pressure is reached."""
        ...

    # TODO: change pump power to be more specific when we find out how were gonna operate that
    async def engage_vacuum(self, pump_power: Optional[float] = None) -> None:
        """Engage the vacuum without regard to chamber pressure."""
        ...

    async def disengage_vacuum_pump(self) -> None:
        """Stops the vacuum pump, doesn't vent air or disable the motor."""
        ...

    # turns off motor, then releases, takes a timeout for buffer between turn off and vent
    async def vent(self) -> None:
        """Release the vacuum in the module chamber."""
        ...

    async def set_led(
        self,
        power: float,
        color: Optional[LEDColor] = None,
        external: Optional[bool] = None,
        pattern: Optional[LEDPattern] = None,
        duration: Optional[int] = None,  # Default firmware duration is 500ms
        reps: Optional[int] = None,  # Default firmware reps is 0
    ) -> None:
        """Set LED Status bar color and pattern."""
        ...

    async def enter_programming_mode(self) -> None:
        """Reboot into programming mode"""
        ...

    async def reset_serial_buffers(self) -> None:
        """Reset the input and output serial buffers."""
        ...
