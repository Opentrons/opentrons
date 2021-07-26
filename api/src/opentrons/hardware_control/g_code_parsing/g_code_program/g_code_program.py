from __future__ import annotations
import json
from typing import List, Union
from opentrons.hardware_control.g_code_parsing.g_code_watcher import GCodeWatcher
from opentrons.hardware_control.g_code_parsing.g_code import GCode
from .supported_text_modes import SupportedTextModes


class GCodeProgram:
    """
    Class for parsing various G-Code files and programs into a
    list of GCode objects
    """
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
            g_codes.extend(
                GCode.from_raw_code(
                    watcher_data.raw_g_code,
                    watcher_data.device,
                    watcher_data.response
                )
            )
        return cls(g_codes)

    def __init__(self, g_codes: List[GCode]):
        self._g_codes = g_codes

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

    def get_text_explanation(self, mode: Union[SupportedTextModes, str]) -> str:
        """
        Returns a textual explanation of all the G-Codes in the GCodeProgram
        :param mode: Mode to output text in. See SupportedTextModes for more info
        :return: Textual description of all GCodes
        """

        if isinstance(mode, SupportedTextModes):
            text_mode = SupportedTextModes.get_text_mode_by_enum_value(mode)
        else:
            text_mode = SupportedTextModes.get_text_mode(mode)
        return '\n'.join(
            [
                text_mode.builder(code)
                for code in self._g_codes
            ]
        )

    def save_text_explanation_to_file(
            self,
            file_path: str,
            mode: Union[SupportedTextModes, str]
    ):

        with open(file_path, 'w') as file:
            file.write(self.get_text_explanation(mode))

    def save_json_to_file(self, file_path: str) -> None:
        """Save JSON to passed file name"""
        with open(file_path, 'w') as file:
            file.write(self.get_json())
