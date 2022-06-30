from abc import ABC, abstractmethod
from typing import Tuple

from random import uniform
from serial import Serial

from .commands import RadwagCommand, radwag_command_format
from .responses import \
    (RadwageResponse, RadwagResponseCodes, radwag_response_parse)


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
    def automatic_internal_adjustment(self, enable: bool) -> None:
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

    def _write_command(self, cmd: RadwagCommand) -> None:
        cmd_str = radwag_command_format(cmd)
        cmd_bytes = cmd_str.encode('utf-8')
        send_len = self._connection.write(cmd_bytes)
        assert send_len == len(cmd_bytes), f'Radwag command \"{cmd}\" ({cmd_bytes} ' \
                                           f'bytes) only sent {send_len} bytes'

    def _read_response(self, command: RadwagCommand) -> RadwageResponse:
        response = self._connection.readline().decode('utf-8')
        data = radwag_response_parse(response, command)
        return data

    def connect(self) -> None:
        self._connection.open()

    def disconnect(self) -> None:
        self._connection.close()

    def read_serial_number(self) -> str:
        cmd = RadwagCommand.GET_SERIAL_NUMBER
        self._write_command(cmd)
        res = self._read_response(cmd)
        assert res.code == RadwagResponseCodes.IN_PROGRESS
        return res.message

    def continuous_transmission(self, enable: bool) -> None:
        if enable:
            cmd = RadwagCommand.ENABLE_CONTINUOUS_TRANS_BASIC_UNIT
        else:
            cmd = RadwagCommand.DISABLE_CONTINUOUS_TRANS_BASIC_UNIT
        self._write_command(cmd)
        res = self._read_response(cmd)
        assert res.code == RadwagResponseCodes.IN_PROGRESS

    def automatic_internal_adjustment(self, enable: bool) -> None:
        if enable:
            cmd = RadwagCommand.ENABLE_AUTO_INTERNAL_ADJUST
        else:
            cmd = RadwagCommand.DISABLE_AUTO_INTERNAL_ADJUST
        self._write_command(cmd)
        res = self._read_response(cmd)
        assert res.code == RadwagResponseCodes.CARRIED_OUT

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

    def continuous_transmission(self, enable: bool) -> None:
        return

    def automatic_internal_adjustment(self, enable: bool) -> None:
        return

    def read_mass(self) -> Tuple[float, bool]:
        return uniform(2.5, 2), True
