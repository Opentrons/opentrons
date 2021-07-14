from __future__ import annotations
import os
import json
from opentrons.hardware_control.emulation.app import \
    TEMPDECK_PORT, THERMOCYCLER_PORT, SMOOTHIE_PORT, MAGDECK_PORT
from typing import List
from opentrons.hardware_control.g_code_parsing.g_code_watcher import GCodeWatcher
from opentrons.hardware_control.g_code_parsing.g_code import GCode
from .supported_text_modes import SupportedTextModes


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
    def from_g_code_watcher(cls, watcher: GCodeWatcher) -> GCodeProgram:
        """
        Function to convert command list collected by GCodeWatcher
        into GCodeProgram
        :param watcher: GCodeWatcher object
        :return: GCodeProgram object
        """
        g_codes = []
        for watcher_data in watcher.get_command_list():
            device = cls._parse_device(watcher_data.serial_connection)
            g_codes.extend(
                GCode.from_raw_code(
                    watcher_data.raw_g_code,
                    device,
                    watcher_data.response
                )
            )
        return cls(g_codes)

    def __init__(self, g_codes: List[GCode]):
        self._g_codes = g_codes

    @classmethod
    def _parse_device(cls, serial_connection):
        """
        Based on port specified in connection URL, parse out what the name
        of the device is
        """
        serial_port = serial_connection.port
        device_port = serial_port[serial_port.rfind(':') + 1:]
        return cls.DEVICE_LOOKUP_BY_PORT[int(device_port)]

    def add_g_code(self, g_code: GCode) -> None:
        """Add singular G-Code to the end of the program"""
        self._g_codes.append(g_code)

    def add_g_codes(self, g_code_list: List[GCode]) -> None:
        """Add a list of G-Codes to the end of a program"""
        self._g_codes.extend(g_code_list)

    def clear_g_codes(self) -> None:
        """Remove all G-Codes from a program"""
        self._g_codes = []

    @property
    def g_codes(self) -> List[GCode]:
        """List of GCode objects"""
        return self._g_codes

    def get_json(self) -> str:
        """Get JSON representation of all G-Codes"""
        return json.dumps(
            [
                code.get_explanation().to_dict()
                for code in self._g_codes
            ],
            indent=4
        )

    def get_text_explanation(self, mode=SupportedTextModes.DEFAULT) -> str:
        """
        Returns a textual explanation of all the G-Codes in the GCodeProgram
        :param mode: Mode to output text in. See SupportedTextModes for more info
        :return: Textual description of all GCodes
        """
        if mode not in SupportedTextModes.__members__:
            supported_modes = ', '.join(SupportedTextModes.__members__.keys())
            raise ValueError(f'Text Mode "{mode}" is not supported. Supported modes'
                             f'are: {supported_modes}')

        selected_mode = SupportedTextModes[mode].value

        return '\n'.join(
            [
                selected_mode.builder(code)
                for code in self._g_codes
            ]
        )

    def save_json_to_file(self, file_name: str) -> None:
        """Save JSON to passed file name"""
        file_path = os.path.join(os.getcwd(), file_name)
        with open(file_path, 'w+') as file:
            file.write(self.get_json())
