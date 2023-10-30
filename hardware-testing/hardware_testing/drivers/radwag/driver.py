"""Radwag Scale Driver."""
from abc import ABC, abstractmethod
from typing import Tuple, Optional
import datetime
from serial import Serial  # type: ignore[import]

from .commands import (
    RadwagCommand,
    RadwagWorkingMode,
    RadwagFilter,
    RadwagValueRelease,
    RadwagAmbiant,
    radwag_command_format,
)
from .responses import RadwagResponse, RadwagResponseCodes, radwag_response_parse

from hardware_testing.data import get_testing_data_directory


class RadwagScaleBase(ABC):
    """Base class if Radwag scale driver."""

    @classmethod
    def vid_pid(cls) -> Tuple[int, int]:
        """Radwag scale VID:PID."""
        # TODO: check and handle the vid:pid of other scales
        # vid:pid for Radwag's "AS 82/220.X2 PLUS" USB2 (usb-b) port
        return 0x0483, 0xA1AD

    @abstractmethod
    def connect(self) -> None:
        """Connect to the scale."""
        ...

    @abstractmethod
    def disconnect(self) -> None:
        """Disconnect from the scale."""
        ...

    @abstractmethod
    def read_serial_number(self) -> float:
        """Read the serial number."""
        ...

    @abstractmethod
    def read_max_capacity(self) -> float:
        """Read the max capacity."""
        ...

    @abstractmethod
    def continuous_transmission(self, enable: bool) -> None:
        """Enable/disable continuous transmission."""
        ...

    @abstractmethod
    def working_mode(self, mode: RadwagWorkingMode) -> None:
        """Set the working mode."""
        ...

    @abstractmethod
    def filter(self, f: RadwagFilter) -> None:
        """Set the filter type."""
        ...

    @abstractmethod
    def value_release(self, val_rel: RadwagValueRelease) -> None:
        """Set the value release."""
        ...

    @abstractmethod
    def automatic_internal_adjustment(self, enable: bool) -> None:
        """Enable/disable automatic internal adjustment."""
        ...

    @abstractmethod
    def internal_adjustment(self) -> None:
        """Run an internal adjustment."""
        ...

    @abstractmethod
    def set_tare(self, tare: float) -> None:
        """Set the tare value."""
        ...

    @abstractmethod
    def read_mass(self) -> Tuple[float, bool]:
        """Read the mass, in grams."""
        ...


class RadwagScale(RadwagScaleBase):
    """Radwag Scale driver."""

    def __init__(self, connection: Serial) -> None:
        """Constructor."""
        self._connection = connection
        _raw_file_path = get_testing_data_directory() / "scale_raw.txt"
        self._raw_log = open(_raw_file_path, "w")

    @classmethod
    def create(
        cls, port: str, baudrate: int = 9600, timeout: float = 1
    ) -> "RadwagScale":
        """Create a Radwag scale driver."""
        conn = Serial()
        conn.port = port
        conn.baudrate = baudrate
        conn.timeout = timeout
        return RadwagScale(connection=conn)

    def _write_command(self, cmd: str) -> None:
        cmd_str = radwag_command_format(cmd)
        cmd_bytes = cmd_str.encode("utf-8")
        send_len = self._connection.write(cmd_bytes)
        self._raw_log.write(f"{datetime.datetime.now()} --> {cmd_bytes!r}\n")
        assert send_len == len(cmd_bytes), (
            f'Radwag command "{cmd}" ({str(cmd_bytes)} '
            f"bytes) only sent {send_len} bytes"
        )

    def _read_response(
        self, command: RadwagCommand, timeout: Optional[float] = None
    ) -> RadwagResponse:
        if timeout is not None:
            prev_timeout = float(self._connection.timeout)
            self._connection.timeout = timeout
            response = self._connection.readline()
            self._connection.timeout = prev_timeout
        else:
            response = self._connection.readline()
        self._raw_log.write(f"{datetime.datetime.now()} <-- {response}\n")
        data = radwag_response_parse(response.decode("utf-8"), command)
        return data

    def _write_command_and_read_response(
        self,
        cmd: RadwagCommand,
        append: str = "",
        timeout: Optional[float] = None,
        retries: int = 3,
    ) -> RadwagResponse:
        try:
            if append:
                self._write_command(f"{cmd} {append}")
            else:
                self._write_command(cmd)
            return self._read_response(cmd, timeout)
        except KeyboardInterrupt as e:
            raise e
        except Exception as e:
            if not retries:
                raise TimeoutError(f"unable to read from scale, got error: {e}")
            print(e)
            return self._write_command_and_read_response(
                cmd, append, timeout, retries - 1
            )

    def connect(self) -> None:
        """Connect."""
        self._connection.open()

    def disconnect(self) -> None:
        """Disconnect."""
        self._connection.close()
        self._raw_log.close()

    def read_max_capacity(self) -> float:
        """Read the max capacity."""
        cmd = RadwagCommand.GET_MAX_CAPACITY
        res = self._write_command_and_read_response(cmd)
        # NOTE: very annoying, different scales give different response codes
        #       where some will just not have a response code at all...
        if len(res.response_list) == 3:
            expected_code = RadwagResponseCodes.IN_PROGRESS
        elif len(res.response_list) == 2:
            expected_code = RadwagResponseCodes.NONE
        else:
            raise RuntimeError(f"unexpected reponse list: {res.response_list}")
        assert res.code == expected_code, f"Unexpected response code: {res.code}"
        assert res.message is not None
        return float(res.message)

    def read_serial_number(self) -> str:
        """Read serial number."""
        cmd = RadwagCommand.GET_SERIAL_NUMBER
        res = self._write_command_and_read_response(cmd)
        assert (
            res.code == RadwagResponseCodes.IN_PROGRESS
        ), f"Unexpected response code: {res.code}"
        assert res.message, "No serial number returned from scale"
        return res.message

    def working_mode(self, mode: RadwagWorkingMode) -> None:
        """Set the working mode."""
        cmd = RadwagCommand.SET_WORKING_MODE
        res = self._write_command_and_read_response(cmd, append=str(mode.value))
        assert (
            res.code == RadwagResponseCodes.CARRIED_OUT
        ), f"Unexpected response code: {res.code}"

    def filter(self, f: RadwagFilter) -> None:
        """Set the filter type."""
        cmd = RadwagCommand.SET_FILTER
        res = self._write_command_and_read_response(cmd, append=str(f.value))
        assert (
            res.code == RadwagResponseCodes.CARRIED_OUT
        ), f"Unexpected response code: {res.code}"

    def value_release(self, val_rel: RadwagValueRelease) -> None:
        """Set the value release type."""
        cmd = RadwagCommand.SET_VALUE_RELEASE
        res = self._write_command_and_read_response(cmd, append=str(val_rel.value))
        assert (
            res.code == RadwagResponseCodes.CARRIED_OUT
        ), f"Unexpected response code: {res.code}"

    def ambiant(self, amb_rel: RadwagAmbiant) -> None:
        """Set the value release type."""
        cmd = RadwagCommand.SET_AMBIENT_CONDITIONS_STATE
        res = self._write_command_and_read_response(cmd, append=str(amb_rel.value))
        assert (
            res.code == RadwagResponseCodes.CARRIED_OUT
        ), f"Unexpected response code: {res.code}"

    def continuous_transmission(self, enable: bool) -> None:
        """Enable/disable continuous transmissions."""
        if enable:
            cmd = RadwagCommand.ENABLE_CONTINUOUS_TRANS_BASIC_UNIT
        else:
            cmd = RadwagCommand.DISABLE_CONTINUOUS_TRANS_BASIC_UNIT
        res = self._write_command_and_read_response(cmd)
        assert (
            res.code == RadwagResponseCodes.IN_PROGRESS
        ), f"Unexpected response code: {res.code}"

    def automatic_internal_adjustment(self, enable: bool) -> None:
        """Enable/disable automatic internal adjustment."""
        if enable:
            cmd = RadwagCommand.ENABLE_AUTO_INTERNAL_ADJUST
        else:
            cmd = RadwagCommand.DISABLE_AUTO_INTERNAL_ADJUST
        res = self._write_command_and_read_response(cmd)
        assert (
            res.code == RadwagResponseCodes.CARRIED_OUT
        ), f"Unexpected response code: {res.code}"

    def zero(self) -> None:
        """Sero the scale."""
        cmd = RadwagCommand.ZERO
        res = self._write_command_and_read_response(cmd)
        assert (
            res.code == RadwagResponseCodes.IN_PROGRESS
        ), f"Unexpected response code: {res.code}"
        res = self._read_response(cmd, timeout=60)
        assert (
            res.code == RadwagResponseCodes.CARRIED_OUT_AFTER_IN_PROGRESS
        ), f"Unexpected response code: {res.code}"

    def internal_adjustment(self) -> None:
        """Run internal adjustment."""
        cmd = RadwagCommand.INTERNAL_ADJUST_PERFORMANCE
        res = self._write_command_and_read_response(cmd)
        assert (
            res.code == RadwagResponseCodes.IN_PROGRESS
        ), f"Unexpected response code: {res.code}"
        res = self._read_response(cmd, timeout=60 * 2)
        assert (
            res.code == RadwagResponseCodes.CARRIED_OUT_AFTER_IN_PROGRESS
        ), f"Unexpected response code: {res.code}"

    def set_tare(self, tare: float) -> None:
        """Set the tare value."""
        assert tare >= 0, f"Radwag tare values cannot be negative (got {tare})"
        cmd = RadwagCommand.SET_TARE
        res = self._write_command_and_read_response(cmd, append=str(round(tare, 5)))
        assert (
            res.code == RadwagResponseCodes.CARRIED_OUT
        ), f"Unexpected response code: {res.code}"

    def read_mass(self) -> Tuple[float, bool]:
        """Read the mass, in grams."""
        cmd = RadwagCommand.GET_MEASUREMENT_BASIC_UNIT
        res = self._write_command_and_read_response(cmd)
        assert res.measurement is not None
        return res.measurement, res.stable


class SimRadwagScale(RadwagScaleBase):
    """Simulating Radwag Scale Driver."""

    def __init__(self) -> None:
        """Constructor."""
        self._mass: float = 0.0

    @property
    def sim_mass(self) -> float:
        """Simulation mass."""
        return self._mass

    def connect(self) -> None:
        """Connect."""
        return

    def disconnect(self) -> None:
        """Disconnect."""
        return

    def read_max_capacity(self) -> float:
        """Read the max capacity."""
        return 220.0  # :shrug: might as well simulate as low-rez scale

    def read_serial_number(self) -> str:
        """Read serial number."""
        return "radwag-sim-serial-num"

    def working_mode(self, mode: RadwagWorkingMode) -> None:
        """Working mode."""
        return

    def filter(self, f: RadwagFilter) -> None:
        """Filter."""
        return

    def value_release(self, val_rel: RadwagValueRelease) -> None:
        """Value release."""
        return

    def ambiant(self, amb_rel: RadwagAmbiant) -> None:
        """Set the value release type."""
        return

    def continuous_transmission(self, enable: bool) -> None:
        """Continuous transmission."""
        return

    def automatic_internal_adjustment(self, enable: bool) -> None:
        """Automatic internal adjustment."""
        return

    def zero(self) -> None:
        """Zero."""
        return

    def internal_adjustment(self) -> None:
        """Internal adjustment."""
        return

    def set_tare(self, tare: float) -> None:
        """Set tare."""
        return

    def read_mass(self) -> Tuple[float, bool]:
        """Read mass."""
        return self._mass, True

    def set_simulation_mass(self, mass: float) -> None:
        """Set simulation mass."""
        self._mass = mass
