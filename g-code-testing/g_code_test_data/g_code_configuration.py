import os
from pathlib import Path
from typing import (
    Callable,
    ClassVar,
    List,
    Optional,
    Set,
    Type,
)
from typing_extensions import (
    Final,
    Literal,
)

import pytest
from _pytest.mark.structures import Mark
from g_code_parsing.g_code_engine import GCodeEngine
from g_code_parsing.g_code_program.supported_text_modes import SupportedTextModes
from opentrons.hardware_control.emulation.settings import Settings, SmoothieSettings
from opentrons.protocols.api_support.types import APIVersion

from pydantic import (
    BaseModel,
    Field,
    constr,
    validator,
)

BUCKET_NAME = "g-code-comparison"
COMPARISON_FILES_FOLDER_PATH = os.path.join(os.path.dirname(__file__), 'comparison_files')


class SharedFunctionsMixin:
    """Functions that GCodeConfirmConfig classes share."""
    def add_mark(self, user_mark: Mark) -> None:
        self.marks.append(user_mark)


class ProtocolGCodeConfirmConfig(BaseModel, SharedFunctionsMixin):
    path: str
    name: Optional[constr(regex=r'^[a-z0-9_]*$')]
    settings: Settings
    results_dir: ClassVar[str] = "protocols"
    driver: str = 'protocol'
    marks: List[Mark] = [pytest.mark.g_code_confirm]
    versions: Set[APIVersion] = Field(..., min_items=1)

    class Config:
        arbitrary_types_allowed = True

    @validator("name", pre=True, always=True)
    def name_from_path(cls, name, values) -> str:
        derived_name = os.path.splitext(os.path.basename(values["path"]))[0]
        return derived_name if name is None else name

    def _get_full_path(self, version: APIVersion):
        return os.path.join(
            COMPARISON_FILES_FOLDER_PATH,
            self.get_comparison_file_path(version)
            )

    def get_configuration_paths(self, version: APIVersion) -> str:
        """Get the configuration file path."""
        return os.path.join(self.results_dir, self.name, version.__str__())

    def get_comparison_file_path(self, version: APIVersion) -> str:
        """Get that path of comparison file."""
        return os.path.join(self.results_dir, version.__str__(), f"{self.name}.txt")

    def get_comparison_file(self, version: APIVersion) -> str:
        """Pull comparison file and print it's content."""
        file_path = self._get_full_path(version)
        file = open(file_path, "r")
        return ''.join(file.readlines()).strip()

    def update_comparison(self, version: APIVersion) -> str:
        """Run config and override the comparison file with output."""
        Path(os.path.dirname(self._get_full_path(version))).mkdir(parents=True, exist_ok=True)
        with open(self._get_full_path(version), 'w') as file:
            file.write(self.execute(version))
        return "File uploaded successfully"

    def comparison_file_exists(self, version: APIVersion) -> bool:
        return os.path.exists(self._get_full_path(version))

    def execute(self, version: APIVersion):
        with GCodeEngine(self.settings).run_protocol(self.path, version) as program:
            return program.get_text_explanation(SupportedTextModes.CONCISE)


class HTTPGCodeConfirmConfig(BaseModel, SharedFunctionsMixin):
    name: constr(regex=r'^[a-z0-9_]*$')
    executable: Callable
    settings: Settings
    results_dir: ClassVar[str] = "http"
    driver: str = 'http'
    marks: List[Mark] = [pytest.mark.g_code_confirm]

    class Config:
        arbitrary_types_allowed = True

    def _get_full_path(self) -> str:
        return os.path.join(COMPARISON_FILES_FOLDER_PATH, self.get_comparison_file_path())

    def comparison_file_exists(self) -> bool:
        return os.path.exists(self._get_full_path())

    def get_configuration_paths(self) -> str:
        """Get the configuration file path."""
        return os.path.join(self.results_dir, f"{self.name}")

    def get_comparison_file_path(self) -> str:
        """Get that path of comparison file."""
        return os.path.join(self.results_dir, f"{self.name}.txt")

    def get_comparison_file(self) -> str:
        """Pull comparison file and print it's content."""
        file = open(self._get_full_path(), "r")
        return ''.join(file.readlines()).strip()

    def update_comparison(self) -> str:
        """Run config and override the comparison file with output."""
        with open(self._get_full_path(), 'w') as file:
            file.write(self.execute())
        return "File uploaded successfully"

    def execute(self):
        with GCodeEngine(self.settings).run_http(self.executable) as program:
            return program.get_text_explanation(SupportedTextModes.CONCISE)
