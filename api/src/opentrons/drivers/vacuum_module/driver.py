import asyncio
import re
from typing import Optional

from .abstract import AbstractVacuumModuleDriver
from .errors import VacuumModuleErrorCodes
from .types import (
    GCODE,
    HardwareRevision,
    LEDColor,
    LEDPattern,
    PressureState,
    PumpState,
    VacuumModuleInfo,
    VentState,
)
from opentrons.drivers.asyncio.communication import AsyncResponseSerialConnection

VM_BAUDRATE = 115200
DEFAULT_VM_TIMEOUT = 5
VM_ACK = "OK\n"
VM_ERROR_KEYWORD = "err"
VM_ASYNC_ERROR_ACK = "async"
DEFAULT_COMMAND_RETRIES = 2
GCODE_ROUNDING_PRECISION = 2

# LED animation range values
MIN_DURATION_MS = 25  # 25ms
MAX_DURATION_MS = 10000  # 10s
MAX_REPS = 10

MAX_PUMP_RPM = 3500
MAX_PUMP_DUTY = 90
MAX_RAMP_RATE = -10.0  # mbar/s
MAX_PRESSURE_MBAR = -1013.25


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
    def parse_get_pressure_state(cls, response: str) -> PressureState:
        """Parse the get pressure state."""
        pattern = r"T:(?P<T>-?\d.+) C:(?P<C>-?\d.+) A:(?P<A>\d.+) B:(?P<B>\d.+) H:(?P<H>\d.+) E:(?P<E>\d) V:(?P<V>\d)"
        _RE = re.compile(rf"^{GCODE.GET_PRESSURE_STATE} {pattern}$")
        match = _RE.match(response)
        if not match:
            raise ValueError(f"Incorrect Response for get pressure state: {response}")
        return PressureState(
            float(match.group("T")),
            float(match.group("C")),
            float(match.group("A")),
            float(match.group("B")),
            float(match.group("H")),
            bool(int(match.group("E"))),
            VentState(int(match.group("V"))),
        )

    @classmethod
    def parse_get_pump_state(cls, response: str) -> PumpState:
        """Parse the get pump state."""
        pattern = r"T:(?P<T>\d.+) R:(?P<R>\d.+) A:(?P<A>\d+) D:(?P<D>\d+) E:(?P<E>\d) M:(?P<M>\d)"
        _RE = re.compile(rf"^{GCODE.GET_PUMP_STATE} {pattern}$")
        match = _RE.match(response)
        if not match:
            raise ValueError(f"Incorrect Response for get pump state: {response}")
        return PumpState(
            float(match.group("T")),
            float(match.group("R")),
            int(match.group("A")),
            int(match.group("D")),
            bool(int(match.group("E"))),
            bool(int(match.group("M"))),
        )

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

    def reset_serial_buffers(self) -> None:
        """Reset the input and output serial buffers."""
        self._connection._serial.reset_input_buffer()
        self._connection._serial.reset_output_buffer()

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

    async def enter_programming_mode(self) -> None:
        """Reboot into programming mode"""
        command = GCODE.ENTER_BOOTLOADER.build_command()
        await self._connection.send_dfu_command(command)
        await self._connection.close()

    async def set_serial_number(self, sn: str) -> None:
        """Set Serial Number."""
        if not re.match(r"^VM[\w]{1}[\d]{2}[\d]{8}[\d]+$", sn):
            raise ValueError(
                f"Invalid serial number: ({sn}) expected format: VMA1020250119001"
            )
        resp = await self._connection.send_command(
            GCODE.SET_SERIAL_NUMBER.build_command().add_element(sn)
        )
        if not re.match(rf"^{GCODE.SET_SERIAL_NUMBER}$", resp):
            raise ValueError(f"Incorrect Response for set serial number: {resp}")

    async def set_led(
        self,
        power: float,
        color: Optional[LEDColor] = None,
        external: Optional[bool] = None,
        pattern: Optional[LEDPattern] = None,
        duration: Optional[int] = None,
        reps: Optional[int] = None,
    ) -> None:
        """Set LED Status bar color and pattern.

        :param power: Power of the LED (0-1.0), 0 is off, 1 is full power
        :param color: Color of the LED
        :param external: True if external LED, False if internal LED
        :param pattern: Animation pattern of the LED status bar
        :param duration: Animation duration in milliseconds (25-10000), 10s max
        :param reps: Number of times to repeat the animation (-1 - 10), -1 is forever.
        """
        power = max(0, min(power, 1.0))
        command = GCODE.SET_LED.build_command().add_float(
            "P", power, GCODE_ROUNDING_PRECISION
        )
        if color is not None:
            command.add_int("C", color.value)
        if external is not None:
            command.add_int("K", int(external))
        if pattern is not None:
            command.add_int("A", pattern.value)
        if duration is not None:
            duration = max(MIN_DURATION_MS, min(duration, MAX_DURATION_MS))
            command.add_int("D", duration)
        if reps is not None:
            command.add_int("R", max(-1, min(reps, MAX_REPS)))
        resp = await self._connection.send_command(command)
        if not re.match(rf"^{GCODE.SET_LED}$", resp):
            raise ValueError(f"Incorrect Response for set led: {resp}")

    async def set_vacuum_state(
        self,
        enable_vacuum: bool,
        guage_pressure_mbar: Optional[float] = None,
        duration: Optional[int] = None,
        rate: Optional[float] = None,
        vent_after: Optional[bool] = None,
    ) -> None:
        """Engage or release the vacuum until a desired internal pressure is reached."""

        command = GCODE.SET_PRESSURE_STATE.build_command().add_int(
            "S", int(enable_vacuum)
        )

        if guage_pressure_mbar is not None:
            command.add_float(
                "P",
                min(max(guage_pressure_mbar, MAX_PRESSURE_MBAR), 0),
                GCODE_ROUNDING_PRECISION,
            )
        if duration is not None:
            command.add_int("D", duration)
        if rate is not None:
            command.add_float("R", min(max(rate, MAX_RAMP_RATE), 0))
        if vent_after is not None:
            command.add_int("V", int(vent_after))

        resp = await self._connection.send_command(command)
        if not re.match(rf"^{GCODE.SET_PRESSURE_STATE}$", resp):
            raise ValueError(f"Incorrect Response for set pressure state: {resp}")

    async def get_vacuum_state(self) -> PressureState:
        """Get the pressure state."""
        resp = await self._connection.send_command(
            GCODE.GET_PRESSURE_STATE.build_command()
        )
        return self.parse_get_pressure_state(resp)

    async def set_pump_state(
        self,
        start_pump: bool,
        target_rpm: Optional[int] = None,
        duty_cycle: Optional[int] = None,
    ) -> None:
        """Start or the stop the pump at a given rpm or duty cycle."""
        if target_rpm and duty_cycle:
            raise ValueError(
                "You cannot set the target rpm and duty cycle at the same time."
            )

        command = GCODE.SET_PUMP_STATE.build_command().add_int("S", int(start_pump))
        if target_rpm is not None:
            command.add_int("R", max(0, min(target_rpm, MAX_PUMP_RPM)))
        if duty_cycle is not None:
            command.add_int("D", max(0, min(duty_cycle, MAX_PUMP_DUTY)))
        resp = await self._connection.send_command(command)
        if not re.match(rf"^{GCODE.SET_PUMP_STATE}$", resp):
            raise ValueError(f"Incorrect Response for set pump state: {resp}")

    async def get_pump_state(self) -> PumpState:
        """Get the pump state."""
        resp = await self._connection.send_command(GCODE.GET_PUMP_STATE.build_command())
        return self.parse_get_pump_state(resp)

    # turns off motor, then releases, takes a timeout for buffer between turn off and vent
    async def set_vent_state(self, state: bool) -> None:
        """Opens/Closes the vent, which release the vacuum in the module chamber."""

        command = GCODE.SET_VENT_STATE.build_command().add_int("V", int(state))
        resp = await self._connection.send_command(command)
        if not re.match(rf"^{GCODE.SET_VENT_STATE}$", resp):
            raise ValueError(f"Incorrect Response for set vent state: {resp}")
