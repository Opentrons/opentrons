from __future__ import annotations
from typing import List, Optional
from opentrons.drivers.asyncio.communication import SerialConnection
from dataclasses import dataclass
from opentrons.hardware_control.emulation.app import (
    TEMPDECK_PORT,
    THERMOCYCLER_PORT,
    SMOOTHIE_PORT,
    MAGDECK_PORT,
)


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
        SMOOTHIE_PORT: "smoothie",
        TEMPDECK_PORT: "tempdeck",
        THERMOCYCLER_PORT: "thermocycler",
        MAGDECK_PORT: "magdeck",
    }

    def __init__(self) -> None:
        self._command_list: List[WatcherData] = []
        self._original_send_data = SerialConnection.send_data

    def __enter__(self) -> GCodeWatcher:
        """Patch the send command function"""

        async def _patch(
            _self: SerialConnection,
            data: str,
            retries: int = 0,
            timeout: Optional[float] = None,
        ) -> str:
            """
            Side-effect function that gathers arguments passed to
            SerialConnection.send_data and stores them internally.

            Args:
                _self: the SerialConnection instance
                data: the raw sent GCODE
                retries: number of retries
                timeout: optional timeout

            Returns:
                the response
            """
            response = await self._original_send_data(_self, data, retries, timeout)
            self._command_list.append(
                WatcherData(
                    raw_g_code=data, device=self._parse_device(_self), response=response
                )
            )
            return response

        # mypy error "Cannot assign to a method" is ignored
        SerialConnection.send_data = _patch  # type: ignore
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Reset the the patch"""
        # mypy error "Cannot assign to a method" is ignored
        SerialConnection.send_data = self._original_send_data  # type: ignore

    @classmethod
    def _parse_device(cls, serial_connection: SerialConnection):
        """
        Based on port specified in connection URL, parse out what the name
        of the device is
        """
        serial_port = serial_connection.port
        device_port = serial_port[serial_port.rfind(":") + 1 :]
        return cls.DEVICE_LOOKUP_BY_PORT[int(device_port)]

    def get_command_list(self) -> List[WatcherData]:
        return self._command_list

    def flush_command_list(self) -> None:
        self._command_list = []
