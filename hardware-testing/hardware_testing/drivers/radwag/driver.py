from abc import ABC, abstractmethod
from typing import Tuple, Optional

from random import uniform
from serial import Serial

from .commands import (
    RadwagCommand, RadwagWorkingMode, RadwagFilter, RadwagValueRelease, radwag_command_format
)
from .responses import (
    RadwagResponse, RadwagResponseCodes, radwag_response_parse
)


class RadwagScaleBase(ABC):
    """Base class if Radwag scale driver."""

    @abstractmethod
    def connect(self) -> None:
        ...

    @abstractmethod
    def disconnect(self) -> None:
        ...

    @abstractmethod
    def read_serial_number(self) -> str:
        ...

    @abstractmethod
    def continuous_transmission(self, enable: bool) -> None:
        ...

    @abstractmethod
    def working_mode(self, mode: RadwagWorkingMode) -> None:
        ...

    @abstractmethod
    def filter(self, f: RadwagFilter) -> None:
        ...

    @abstractmethod
    def value_release(self, val_rel: RadwagValueRelease) -> None:
        ...

    @abstractmethod
    def automatic_internal_adjustment(self, enable: bool) -> None:
        ...

    @abstractmethod
    def internal_adjustment(self) -> None:
        ...

    @abstractmethod
    def set_tare(self, tare: float) -> None:
        ...

    @abstractmethod
    def read_mass(self) -> Tuple[float, bool]:
        ...


class RadwagScale(RadwagScaleBase):
    def __init__(self, connection: Serial) -> None:
        self._connection = connection

    @classmethod
    def vid_pid(cls) -> Tuple[int, int]:
        # TODO: check and handle the vid:pid of other scales
        # vid:pid for Radwag's "AS 82/220.X2 PLUS" USB2 (usb-b) port
        return 1155, 41389

    @classmethod
    def create(cls, port: str, baudrate: int = 9600, timeout: float = 1) -> "RadwagScale":
        conn = Serial()
        conn.port = port
        conn.baudrate = baudrate
        conn.timeout = timeout
        return RadwagScale(connection=conn)

    def _write_command(self, cmd: str) -> None:
        cmd_str = radwag_command_format(cmd)
        cmd_bytes = cmd_str.encode('utf-8')
        send_len = self._connection.write(cmd_bytes)
        assert send_len == len(cmd_bytes), f'Radwag command \"{cmd}\" ({cmd_bytes} ' \
                                           f'bytes) only sent {send_len} bytes'

    def _read_response(self, command: RadwagCommand, timeout: Optional[float] = None) -> RadwagResponse:
        if timeout is not None:
            prev_timeout = float(self._connection.timeout)
            self._connection.timeout = timeout
            response = self._connection.readline()
            self._connection.timeout = prev_timeout
        else:
            response = self._connection.readline()
        data = radwag_response_parse(response.decode('utf-8'), command)
        return data

    def connect(self) -> None:
        self._connection.open()

    def disconnect(self) -> None:
        self._connection.close()

    def read_serial_number(self) -> str:
        cmd = RadwagCommand.GET_SERIAL_NUMBER
        self._write_command(cmd)
        res = self._read_response(cmd)
        assert res.code == RadwagResponseCodes.IN_PROGRESS, \
            f'Unexpected response code: {res.code}'
        return res.message

    def working_mode(self, mode: RadwagWorkingMode) -> None:
        cmd = RadwagCommand.SET_WORKING_MODE
        self._write_command(f'{cmd} {mode.value}')
        res = self._read_response(cmd)
        assert res.code == RadwagResponseCodes.CARRIED_OUT, \
            f'Unexpected response code: {res.code}'

    def filter(self, f: RadwagFilter) -> None:
        cmd = RadwagCommand.SET_FILTER
        self._write_command(f'{cmd} {f.value}')
        res = self._read_response(cmd)
        assert res.code == RadwagResponseCodes.CARRIED_OUT, \
            f'Unexpected response code: {res.code}'

    def value_release(self, val_rel: RadwagValueRelease) -> None:
        cmd = RadwagCommand.SET_VALUE_RELEASE
        self._write_command(f'{cmd} {val_rel.value}')
        res = self._read_response(cmd)
        assert res.code == RadwagResponseCodes.CARRIED_OUT, \
            f'Unexpected response code: {res.code}'

    def continuous_transmission(self, enable: bool) -> None:
        if enable:
            cmd = RadwagCommand.ENABLE_CONTINUOUS_TRANS_BASIC_UNIT
        else:
            cmd = RadwagCommand.DISABLE_CONTINUOUS_TRANS_BASIC_UNIT
        self._write_command(cmd)
        res = self._read_response(cmd)
        assert res.code == RadwagResponseCodes.IN_PROGRESS, \
            f'Unexpected response code: {res.code}'

    def automatic_internal_adjustment(self, enable: bool) -> None:
        if enable:
            cmd = RadwagCommand.ENABLE_AUTO_INTERNAL_ADJUST
        else:
            cmd = RadwagCommand.DISABLE_AUTO_INTERNAL_ADJUST
        self._write_command(cmd)
        res = self._read_response(cmd)
        assert res.code == RadwagResponseCodes.CARRIED_OUT, \
            f'Unexpected response code: {res.code}'

    def internal_adjustment(self) -> None:
        cmd = RadwagCommand.INTERNAL_ADJUST_PERFORMANCE
        self._write_command(cmd)
        res = self._read_response(cmd)
        assert res.code == RadwagResponseCodes.IN_PROGRESS, \
            f'Unexpected response code: {res.code}'
        res = self._read_response(cmd, timeout=60 * 2)
        assert res.code == RadwagResponseCodes.CARRIED_OUT_AFTER_IN_PROGRESS, \
            f'Unexpected response code: {res.code}'

    def set_tare(self, tare: float) -> None:
        assert tare >= 0, f'Radwag tare values cannot be negative (got {tare})'
        cmd = RadwagCommand.SET_TARE
        self._write_command(f'{cmd} {round(tare, 5)}')
        res = self._read_response(cmd)
        assert res.code == RadwagResponseCodes.CARRIED_OUT, \
            f'Unexpected response code: {res.code}'

    def read_mass(self) -> Tuple[float, bool]:
        cmd = RadwagCommand.GET_MEASUREMENT_BASIC_UNIT
        self._write_command(cmd)
        res = self._read_response(cmd)
        assert res.measurement is not None
        return res.measurement, res.stable


class SimRadwagScale(RadwagScaleBase):

    def connect(self) -> None:
        return

    def disconnect(self) -> None:
        return

    def read_serial_number(self) -> str:
        return 'radwag-sim-serial-num'

    def working_mode(self, mode: RadwagWorkingMode) -> None:
        return

    def filter(self, f: RadwagFilter) -> None:
        return

    def value_release(self, val_rel: RadwagValueRelease) -> None:
        return

    def continuous_transmission(self, enable: bool) -> None:
        return

    def automatic_internal_adjustment(self, enable: bool) -> None:
        return

    def internal_adjustment(self) -> None:
        return

    def set_tare(self, tare: float) -> None:
        return

    def read_mass(self) -> Tuple[float, bool]:
        return uniform(2.5, 2), True
