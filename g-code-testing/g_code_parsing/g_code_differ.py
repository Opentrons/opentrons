from __future__ import annotations

from typing import Tuple
from diff_match_patch import diff_match_patch as dmp  # type: ignore
from g_code_parsing.g_code_program.g_code_program import (
    GCodeProgram,
)
from g_code_parsing.g_code_program.supported_text_modes import (
    SupportedTextModes,
)


class GCodeDiffer:
    INSERTION_TYPE = "Insertion"
    INSERTION_VALUE = 1
    EQUALITY_TYPE = "Equality"
    EQUALITY_VALUE = 0
    DELETION_TYPE = "Deletion"
    DELETION_VALUE = -1

    DIFF_TYPE_LOOKUP = {
        DELETION_VALUE: DELETION_TYPE,
        EQUALITY_VALUE: EQUALITY_TYPE,
        INSERTION_VALUE: INSERTION_TYPE,
    }

    INSERTION_STYLE = (
        '<ins style="'
        "background:#e6ffe6;"
        "font-size:large;"
        "font-weight:bold;"
        '">%s</ins>'
    )

    DELETION_STYLE = (
        '<del style="'
        "background:#ffe6e6;"
        "font-size:large;"
        "font-weight:bold;"
        '">%s</del>'
    )

    @classmethod
    def from_g_code_program(
        cls, program_1: GCodeProgram, program_2: GCodeProgram
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
        return differ.diff_main(text1=self._string_1, text2=self._string_2)

    def get_html_diff(self) -> str:
        return self._render_diff_as_html(self.get_diff())

    def _render_diff_as_html(self, diffs) -> str:
        """Convert a diff array into a pretty HTML report"""

        def process_text(text_to_process: str):
            return (
                text_to_process.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\n", "<br>")
            )

        html = []
        for (op, data) in diffs:
            text = process_text(data)
            if op == self.INSERTION_VALUE:
                html.append(self.INSERTION_STYLE % text)
            elif op == self.DELETION_VALUE:
                html.append(self.DELETION_STYLE % text)
            elif op == self.EQUALITY_VALUE:
                html.append("<span>%s</span>" % text)
        return "".join(html)

    def save_html_diff_to_file(self, file_path: str) -> None:
        with open(file_path, "w") as file:
            file.write(self.get_html_diff())

    def strings_are_equal(self):
        return self._string_1 == self._string_2

    @classmethod
    def get_diff_type(cls, diff_tuple: Tuple[int, str]) -> str:
        return cls.DIFF_TYPE_LOOKUP[diff_tuple[0]]

    @classmethod
    def get_diff_content(cls, diff_tuple: Tuple[int, str]) -> str:
        return diff_tuple[1]
