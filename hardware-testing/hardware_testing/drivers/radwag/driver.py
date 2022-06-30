import serial
from typing import Tuple

from .commands import RadwagCommand, radwag_command_format
from .responses import \
    (RadwageResponse, RadwagResponseCodes, radwag_response_parse)

# vid:pid for Radwag's "AS 82/220.X2 PLUS" USB2 (usb-b) port
USB_VID = 1155
USB_PID = 41389


class RadwagScale:
    def __init__(self, connection: serial.Serial) -> None:
        self._connection = connection

    @classmethod
    def create(cls, port: str, baudrate: int = 9600, timeout: float = 1) -> "RadwagScale":
        conn = serial.Serial()
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

    def set_working_mode(self) -> None:
        # TODO: set working mode (Precision)
        return

    def read_mass(self) -> Tuple[float, bool]:
        cmd = RadwagCommand.GET_MEASUREMENT_BASIC_UNIT
        self._write_command(cmd)
        res = self._read_response(cmd)
        assert res.measurement is not None
        return res.measurement, res.stable
