from __future__ import annotations

from typing import Tuple
from diff_match_patch import diff_match_patch as dmp  # type: ignore
from opentrons.hardware_control.g_code_parsing.g_code_program.g_code_program import \
    GCodeProgram
from opentrons.hardware_control.g_code_parsing.g_code_program.supported_text_modes \
    import SupportedTextModes


class GCodeDiffer:
    INSERTION_TYPE = 'Insertion'
    EQUALITY_TYPE = 'Equality'
    DELETION_TYPE = 'Deletion'

    DIFF_TYPE_LOOKUP = {
        -1: DELETION_TYPE,
        0: EQUALITY_TYPE,
        1: INSERTION_TYPE
    }

    @classmethod
    def from_g_code_program(
            cls,
            program_1: GCodeProgram,
            program_2: GCodeProgram
    ) -> GCodeDiffer:
        string_1 = program_1.get_text_explanation(SupportedTextModes.CONCISE.value)
        string_2 = program_2.get_text_explanation(SupportedTextModes.CONCISE.value)
        return cls(string_1, string_2)

    def __init__(self, string_1: str, string_2: str):
        self._string_1 = string_1
        self._string_2 = string_2

    def get_diff(self, timeout_secs=10):
        differ = dmp()
        differ.Diff_Timeout = timeout_secs
        return differ.diff_main(
            text1=self._string_1,
            text2=self._string_2
        )

    def get_html_diff(self):
        return dmp().diff_prettyHtml(self.get_diff())

    def save_html_diff_to_file(self, file_path):
        with open(file_path, 'w') as file:
            file.write(self.get_html_diff())

    @classmethod
    def get_diff_type(cls, diff_tuple: Tuple[int, str]):
        return cls.DIFF_TYPE_LOOKUP[diff_tuple[0]]

    @classmethod
    def get_diff_content(cls, diff_tuple: Tuple[int, str]):
        return diff_tuple[1]
