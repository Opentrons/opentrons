import os
from typing import Callable, List, Type
from typing_extensions import Final

import pytest
from _pytest.mark.structures import Mark
from g_code_parsing.g_code_engine import GCodeEngine
from g_code_parsing.g_code_program.supported_text_modes import SupportedTextModes
from opentrons.hardware_control.emulation.settings import Settings, SmoothieSettings

from pydantic import BaseModel, constr

BUCKET_NAME = "g-code-comparison"
MASTER_FILES_FOLDER_PATH = os.path.join(os.path.dirname(__file__), 'comparison_files')

class SharedFunctionsMixin:
    """Functions that GCodeConfirmConfig classes share."""

    def get_configuration_path(self) -> str:
        """Get the configuration file path."""
        return f'{self.driver}/{self.name}'

    def get_comparison_file_path(self) -> str:
        """Get that path of the file in S3."""
        return self.results_path

    def get_comparison_file(self) -> str:
        """Pull file from S3 and print it's content."""
        file_path = os.path.join(MASTER_FILES_FOLDER_PATH, self.get_comparison_file_path())
        file = open(file_path, "r")
        return ''.join(file.readlines()).strip()

    def update_comparison(self) -> str:
        """Run config and upload it to S3."""
        with open(os.path.join(MASTER_FILES_FOLDER_PATH, self.get_comparison_file_path()), 'w') as file:
            file.write(self.execute())
        return "File uploaded successfully"

    def add_mark(self, user_mark: Mark) -> None:
        self.marks.append(user_mark)

    def generate_pytest_param(self):
        """
        Turn the configuration into a pytest parameter.
        Doing this to give the test a user readable name and to
        add any metadata to the tests through marks.
        See:
        https://docs.pytest.org/en/6.2.x/example/parametrize.html#set-marks-or-test-id-for-individual-parametrized-test
        https://docs.pytest.org/en/6.2.x/example/markers.html
        :param user_marks: A list of
        :return:
        """
        return pytest.param(
            self,
            id=f'test_{self.name}',
            marks=self.marks,
        )


class ProtocolGCodeConfirmConfig(BaseModel, SharedFunctionsMixin):
    name: constr(regex=r'^[a-z0-9_]*$')
    path: str
    settings: Settings
    results_path: str
    driver: str = 'protocol'
    marks: List[Mark] = [pytest.mark.g_code_confirm]

    class Config:
        arbitrary_types_allowed = True

    def execute(self):
        with GCodeEngine(self.settings).run_protocol(path=self.path) as program:
            return program.get_text_explanation(SupportedTextModes.CONCISE)


class HTTPGCodeConfirmConfig(BaseModel, SharedFunctionsMixin):
    name: constr(regex=r'^[a-z0-9_]*$')
    executable: Callable
    settings: Settings
    results_path: str
    driver: str = 'http'
    marks: List[Mark] = [pytest.mark.g_code_confirm]

    class Config:
        arbitrary_types_allowed = True

    def execute(self):
        with GCodeEngine(self.settings).run_http(self.executable) as program:
            return program.get_text_explanation(SupportedTextModes.CONCISE)
