from typing import List
from serial import Serial  # type: ignore
from opentrons.drivers import serial_communication
from dataclasses import dataclass
from opentrons.hardware_control.emulation.app import \
    TEMPDECK_PORT, THERMOCYCLER_PORT, SMOOTHIE_PORT, MAGDECK_PORT


@dataclass
class WatcherData:
    raw_g_code: str
    device: str
    response: str


class GCodeWatcher:
    """
    Watches commands sent to serial_communication.write_and_return
    extracts the parameters passed and stores them
    """

    DEVICE_LOOKUP_BY_PORT = {
        SMOOTHIE_PORT: 'smoothie',
        TEMPDECK_PORT: 'tempdeck',
        THERMOCYCLER_PORT: 'thermocycler',
        MAGDECK_PORT: 'magdeck',
    }

    def __init__(self) -> None:
        self._command_list: List[WatcherData] = []

        self._old_write_return = serial_communication.write_and_return
        serial_communication.write_and_return = self._pull_info

    @classmethod
    def _parse_device(cls, serial_connection: Serial):
        """
        Based on port specified in connection URL, parse out what the name
        of the device is
        """
        serial_port = serial_connection.port
        device_port = serial_port[serial_port.rfind(':') + 1:]
        return cls.DEVICE_LOOKUP_BY_PORT[int(device_port)]

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
                device=self._parse_device(args[2]),
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
