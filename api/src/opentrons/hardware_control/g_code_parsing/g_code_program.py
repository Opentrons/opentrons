from __future__ import annotations
import os
import json
from opentrons.hardware_control.emulation.app import \
    TEMPDECK_PORT, THERMOCYCLER_PORT, SMOOTHIE_PORT, MAGDECK_PORT

from .g_code import GCode
from typing import List

from .g_code_watcher import GCodeWatcher


class GCodeProgram:
    """
    Class for parsing various G-Code files and programs into a
    list of GCode objects
    """

    DEVICE_LOOKUP_BY_PORT = {
        SMOOTHIE_PORT: 'smoothie',
        TEMPDECK_PORT: 'tempdeck',
        THERMOCYCLER_PORT: 'thermocycler',
        MAGDECK_PORT: 'magdeck',
    }

    @classmethod
    def get_device(cls, serial_connection):
        serial_port = serial_connection.port
        device_port = serial_port[serial_port.rfind(':') + 1:]
        return cls.DEVICE_LOOKUP_BY_PORT[int(device_port)]

    @classmethod
    def from_g_code_watcher(cls, watcher: GCodeWatcher) -> GCodeProgram:
        """
        Function to convert command list collected by GCodeWatcher
        into GCodeProgram
        :param watcher: GCodeWatcher object
        :return: GCodeProgram object
        """
        g_codes = []
        for watcher_data in watcher.get_command_list():
            device = cls.get_device(watcher_data.serial_connection)
            g_codes.extend(
                GCode.from_raw_code(watcher_data.raw_g_code, watcher_data.date, device)
            )
        return cls(g_codes)

    def __init__(self, g_codes: List[GCode]):
        self._g_codes = g_codes

    @property
    def g_codes(self) -> List[GCode]:
        """List of GCode objects"""
        return self._g_codes

    def get_json(self) -> str:
        return json.dumps(
            [
                code.get_explanation()
                for code in self._g_codes
            ],
            indent=4
        )

    def save_json_to_file(self, file_name: str) -> None:
        file_path = os.path.join(os.getcwd(), file_name)
        with open(file_path, 'w+') as file:
            file.write(self.get_json())
