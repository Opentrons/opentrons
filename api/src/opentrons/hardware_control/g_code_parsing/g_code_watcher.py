from unittest.mock import MagicMock, DEFAULT
from typing import List
from serial import Serial  # type: ignore
from opentrons.drivers import serial_communication
from dataclasses import dataclass
from time import time


@dataclass
class WatcherData:
    raw_g_code: str
    serial_connection: Serial
    response: str


class GCodeWatcher:
    """
    Watches commands sent to serial_communication.write_and_return
    extracts the parameters passed and stores them
    """
    def __init__(self) -> None:
        self._command_list: List[WatcherData] = []

        self._old_write_return = serial_communication.write_and_return
        serial_communication.write_and_return = self._pull_info

    def _pull_info(self, *args, **kwargs):
        """
        Side-effect function that gathers arguments passed to
        write_and_return, adds the current datetime to the list
        of arguments, and stores them internally.

        Note: Does not do anything with the kwargs. They data
        provided in them is not required. It is still required that
        the parameter be specified in the method signature though.
        """
        response = self._old_write_return(*args, **kwargs)
        self._command_list.append(
            WatcherData(
                raw_g_code=args[0],
                serial_connection=args[2],
                response=response
            )
        )
        return response

    def get_command_list(self) -> List[WatcherData]:
        return self._command_list

    def flush_command_list(self) -> None:
        self._command_list = []

    def cleanup(self) -> None:
        serial_communication.write_and_return = self._old_write_return
