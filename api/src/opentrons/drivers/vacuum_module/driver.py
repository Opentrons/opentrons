import asyncio
import re
from typing import Dict, Optional

from serial.tools.list_ports import comports  # type: ignore[import-untyped]

from .abstract import AbstractVacuumModuleDriver
from .errors import VacuumModuleErrorCodes
from .types import (
    GCODE,
    LEDColor,
    LEDPattern,
    PressureControlTunings,
    PumpState,
    VacuumState,
    VentState,
    WasteConfigParameters,
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
MAX_PUMP_DUTY = 100
MAX_RAMP_RATE = -10.0  # mbar/s
MIN_GAUGE_PRESSURE_MBAR = 0
MAX_GAUGE_PRESSURE_MBAR = -800
THEORETICAL_MAX_GAUGE_PRESSURE_MBAR = -1013.25
MAX_VAC_DURATION_S = 60 * 60 * 24  # 24hrs


class VacuumModuleDriver(AbstractVacuumModuleDriver):
    """Driver for Opentrons Vacuum Module."""

    @classmethod
    def parse_device_info(cls, response: str) -> Dict[str, str]:
        """Parse vacuum module info."""
        _RE = re.compile(
            f"^{GCODE.GET_DEVICE_INFO} FW:(?P<fw>\\S+) HW:Opentrons-vacuum-module-(?P<hw>\\S+) SerialNo:(?P<sn>\\S+)$"
        )
        m = _RE.match(response)
        if not m:
            raise ValueError(f"Incorrect Response for device info: {response}")

        return {
            "serial": m.group("sn"),
            "version": m.group("fw"),
            "model": m.group("hw"),
        }

    @classmethod
    def parse_reset_reason(cls, response: str) -> int:
        """Parse the reset reason"""
        _RE = re.compile(rf"^{GCODE.GET_RESET_REASON} R:(?P<R>\d)$")
        match = _RE.match(response)
        if not match:
            raise ValueError(f"Incorrect Response for reset reason: {response}")
        return int(match.group("R"))

    @classmethod
    def parse_get_pressure_state(cls, response: str) -> VacuumState:
        """Parse the get pressure state."""
        pattern = r"T:(?P<T>-?\d.+) C:(?P<C>-?\d.+) A:(?P<A>\d.+) B:(?P<B>\d.+) H:(?P<H>\d.+) E:(?P<E>\d) D:(?P<D>\d+) V:(?P<V>\d)"
        _RE = re.compile(rf"^{GCODE.GET_PRESSURE_STATE} {pattern}$")
        match = _RE.match(response)
        if not match:
            raise ValueError(f"Incorrect Response for get pressure state: {response}")
        return VacuumState(
            float(match.group("T")),
            float(match.group("C")),
            float(match.group("A")),
            float(match.group("B")),
            float(match.group("H")),
            bool(int(match.group("E"))),
            int(match.group("D")),
            VentState(int(match.group("V"))),
        )

    @classmethod
    def parse_get_pressure_pid(cls, response: str) -> PressureControlTunings:
        """Parse the get pressure pid."""
        pattern = (
            r"P:(?P<P>\d.+) I:(?P<I>\d.+) D:(?P<D>\d.+) O:(?P<O>-?\d.+) "
            r"V:(?P<V>\d.+) H:(?P<H>\d.+) T:(?P<T>\d.+) "
            r"A:(?P<A>\d.+) S:(?P<S>\d.+)"
        )
        _RE = re.compile(rf"^{GCODE.GET_PRESSURE_PID} {pattern}$")
        match = _RE.match(response)
        if not match:
            raise ValueError(f"Incorrect Response for get pressure pid: {response}")
        return PressureControlTunings(
            float(match.group("P")),
            float(match.group("I")),
            float(match.group("D")),
            float(match.group("O")),
            float(match.group("V")),
            float(match.group("H")),
            float(match.group("T")),
            float(match.group("A")),
            float(match.group("S")),
        )

    @classmethod
    def parse_get_waste_configs(cls, response: str) -> WasteConfigParameters:
        """Parse the get waste configs."""
        pattern = r"E:(?P<E>\d) S:(?P<S>\d.+) P:(?P<P>\d.+) F:(?P<F>\d.+) D:(?P<D>\d.+) R:(?P<R>\d.+) C:(?P<C>\d.+) A:(?P<A>\d.+) M:(?P<M>\d.+) X:(?P<X>\d.+)"
        _RE = re.compile(rf"^{GCODE.GET_WASTE_CONFIG} {pattern}$")
        match = _RE.match(response)
        if not match:
            raise ValueError(f"Incorrect Response for get waste confis: {response}")
        return WasteConfigParameters(
            bool(match.group("E")),
            float(match.group("S")),
            float(match.group("P")),
            float(match.group("F")),
            float(match.group("D")),
            float(match.group("R")),
            float(match.group("C")),
            float(match.group("A")),
            float(match.group("M")),
            float(match.group("X")),
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
            # Do not reset the input buffer before writes. Waste-full (and other async
            # module errors) are one-shot UART notifications that can arrive between
            # commands. Clearing the buffer on every write drops them before the
            # next read can partition and raise them.
            reset_buffer_before_write=False,
            error_codes=VacuumModuleErrorCodes,
        )
        return cls(connection)

    @classmethod
    async def create_from_sn(
        cls, sn: str, loop: Optional[asyncio.AbstractEventLoop]
    ) -> "VacuumModuleDriver":
        """Create a Vacuum Module driver using its usb serial number.."""
        port_name = None
        for port in comports():
            if port.serial_number == sn:
                port_name = port.device
                break
        if not port_name:
            raise ValueError(
                f"Could not find connected vacuum module with serial number {sn}"
            )

        return await cls.create(port=port_name, loop=loop)

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

    async def move_port(self, new_port: str) -> None:
        """Try to change the port of the underlying connection."""
        await self._connection.update_port(new_port)

    def reset_serial_buffers(self) -> None:
        """Reset the input and output serial buffers."""
        self._connection._serial.reset_input_buffer()
        self._connection._serial.reset_output_buffer()

    async def get_device_info(self) -> Dict[str, str]:
        """Get Device Info."""
        response = await self._connection.send_command(
            GCODE.GET_DEVICE_INFO.build_command()
        )
        device_info = self.parse_device_info(response)
        reason_resp = await self._connection.send_command(
            GCODE.GET_RESET_REASON.build_command()
        )
        reason = self.parse_reset_reason(reason_resp)
        device_info["reset_reason"] = str(reason)
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
        gauge_pressure_mbar: Optional[float] = None,
        duration_s: Optional[int] = None,
        timeout_s: Optional[int] = None,
        rate: Optional[float] = None,
        vent_after: Optional[bool] = None,
    ) -> None:
        """Engage or release the vacuum until a desired internal pressure is reached."""

        command = GCODE.SET_PRESSURE_STATE.build_command().add_int(
            "S", int(enable_vacuum)
        )

        if gauge_pressure_mbar is not None:
            command.add_float(
                "P",
                min(max(gauge_pressure_mbar, THEORETICAL_MAX_GAUGE_PRESSURE_MBAR), 0),
                GCODE_ROUNDING_PRECISION,
            )
        if duration_s is not None:
            command.add_int("D", max(0, min(duration_s, MAX_VAC_DURATION_S)))
        if timeout_s is not None:
            command.add_int("T", max(0, min(timeout_s, MAX_VAC_DURATION_S)))
        if rate is not None:
            command.add_float("R", min(max(rate, MAX_RAMP_RATE), 0))
        if vent_after is not None:
            command.add_int("V", int(vent_after))

        resp = await self._connection.send_command(command)
        if not re.match(rf"^{GCODE.SET_PRESSURE_STATE}$", resp):
            raise ValueError(f"Incorrect Response for set pressure state: {resp}")

    async def get_vacuum_state(self) -> VacuumState:
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
        duration_s: Optional[int] = None,
        timeout_s: Optional[int] = None,
        rate: Optional[float] = None,
        vent_after: Optional[bool] = None,
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
        if duration_s is not None:
            command.add_int("E", max(0, min(duration_s, MAX_VAC_DURATION_S)))
        if timeout_s is not None:
            command.add_int("T", max(0, min(timeout_s, MAX_VAC_DURATION_S)))
        if rate is not None:
            command.add_float("A", max(1, min(rate, MAX_PUMP_DUTY)))
        if vent_after is not None:
            command.add_int("V", int(vent_after))
        resp = await self._connection.send_command(command)
        if not re.match(rf"^{GCODE.SET_PUMP_STATE}$", resp):
            raise ValueError(f"Incorrect Response for set pump state: {resp}")

    async def get_pump_state(self) -> PumpState:
        """Get the pump state."""
        resp = await self._connection.send_command(GCODE.GET_PUMP_STATE.build_command())
        return self.parse_get_pump_state(resp)

    # turns off motor, then releases, takes a timeout for buffer between turn off and vent
    async def set_vent_state(self, state: VentState) -> None:
        """Opens/Closes the vent, which release the vacuum in the module chamber."""

        command = GCODE.SET_VENT_STATE.build_command().add_int("V", state.value)
        resp = await self._connection.send_command(command)
        if not re.match(rf"^{GCODE.SET_VENT_STATE}$", resp):
            raise ValueError(f"Incorrect Response for set vent state: {resp}")

    async def set_pressure_control_tunings(
        self,
        kp: Optional[float] = None,
        ki: Optional[float] = None,
        kd: Optional[float] = None,
        overshoot: Optional[float] = None,
        k_velocity: Optional[float] = None,
        k_holding: Optional[float] = None,
        tolerance: Optional[float] = None,
        approach_band: Optional[float] = None,
        slew_end_fraction: Optional[float] = None,
        reset: bool = False,
    ) -> None:
        """Sets the PID tuning parameters for pressure control."""

        command = GCODE.SET_PRESSURE_PID.build_command()
        for letter, value in (
            ("P", kp),
            ("I", ki),
            ("D", kd),
            ("O", overshoot),
            ("V", k_velocity),
            ("H", k_holding),
            ("T", tolerance),
            ("A", approach_band),
            ("S", slew_end_fraction),
        ):
            if value is not None:
                command.add_float(letter, value, GCODE_ROUNDING_PRECISION)
        command.add_int("R", int(reset))

        resp = await self._connection.send_command(command)
        if not re.match(rf"^{GCODE.SET_PRESSURE_PID}$", resp):
            raise ValueError(f"Incorrect Response for set pressure pid: {resp}")

    async def get_pressure_control_tunings(self) -> PressureControlTunings:
        """Get the pressure control pid tunings."""
        resp = await self._connection.send_command(
            GCODE.GET_PRESSURE_PID.build_command()
        )
        return self.parse_get_pressure_pid(resp)

    async def set_waste_configs(
        self,
        enable_waste_full_detection: bool,
        p_window_start: Optional[float] = None,
        p_window_end: Optional[float] = None,
        baseline_fast_factor: Optional[float] = None,
        max_delta_per_tick: Optional[float] = None,
        max_rise_per_tick: Optional[float] = None,
        max_cummulative_rise: Optional[float] = None,
        p_filter_alpha: Optional[float] = None,
        min_window_time: Optional[float] = None,
        max_window_time: Optional[float] = None,
    ) -> None:
        """Sets the Waste Full detection algorithm parameters"""

        command = GCODE.SET_WASTE_CONFIG.build_command()
        for letter, value in (
            ("S", p_window_start),
            ("P", p_window_end),
            ("F", baseline_fast_factor),
            ("D", max_delta_per_tick),
            ("R", max_rise_per_tick),
            ("C", max_cummulative_rise),
            ("A", p_filter_alpha),
            ("M", min_window_time),
            ("X", max_window_time),
        ):
            if value is not None:
                command.add_float(letter, value, GCODE_ROUNDING_PRECISION)
        command.add_int("E", int(enable_waste_full_detection))

        resp = await self._connection.send_command(command)
        if not re.match(rf"^{GCODE.SET_WASTE_CONFIG}$", resp):
            raise ValueError(f"Incorrect Response for set waste config: {resp}")

    async def get_waste_configs(self) -> WasteConfigParameters:
        """Get the waste full detection configs"""
        resp = await self._connection.send_command(
            GCODE.GET_WASTE_CONFIG.build_command()
        )
        return self.parse_get_waste_configs(resp)
