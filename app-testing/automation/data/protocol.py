"""Model of a protocol for testing."""

import hashlib
import os
from pathlib import Path
from typing import Literal, Optional

from pydantic import BaseModel, Field

from automation.resources.robot_data import module_types

GENERATED_PROTOCOLS_FOLDER = "generated_protocols"
OVERRIDE_MONIKER = "_Override_"


class Protocol(BaseModel):
    """Model to describe a protocol used in a test."""

    file_stem: str = Field(description="file name not including extension")
    file_extension: Literal["json", "py"] = Field(description="file extension of the protocol")
    robot: Literal["OT2", "Flex"] = Field(description="the robot type which will appear in the robot field in the app")
    app_error: bool = Field(description="will analysis with the app raise an error")
    robot_error: bool = Field(description="will analysis with the robot raise an error")
    app_analysis_error: Optional[str] = Field(description="the exact error shown in the app popout", default=None)
    robot_analysis_error: Optional[str] = Field(description="the exact analysis error from the robot", default=None)
    custom_labware: Optional[list[str]] = Field(description="list of custom labware file stems", default=None)
    instruments: Optional[list[str]] = Field(description="list of instruments that will show in the app", default=None)
    modules: Optional[list[module_types]] = Field(description="list of modules that will show in the app", default=None)
    description: Optional[str] = Field(description="Details about this protocol", default=None)
    expected_test_failure: bool = Field(description="Is this test expected to fail", default=False)
    expected_test_reason: Optional[str] = Field(description="Reason test is failing", default=None)
    override_variable_name: Optional[str] = Field(description="The variable name to override", default=None)
    override_value: Optional[str] = Field(description="The value of the override", default=None)
    from_override: bool = Field(description="Is this protocol generated from an override", default=False)

    @property
    def file_path(self) -> Path:
        """Path of the file."""
        if self.from_override:
            return Path(
                Path(__file__).resolve().parent.parent.parent,
                os.getenv("FILES_FOLDER", "files"),
                "protocols",
                GENERATED_PROTOCOLS_FOLDER,
                f"{self.file_stem}.{self.file_extension}",
            )
        return Path(
            Path(__file__).resolve().parent.parent.parent,
            os.getenv("FILES_FOLDER", "files"),
            "protocols",
            f"{self.file_stem}.{self.file_extension}",
        )

    @property
    def labware_paths(self) -> list[Path]:
        """Path of the file."""
        if self.custom_labware is None:
            return []
        return [
            Path(
                Path(__file__).resolve().parent.parent.parent,
                os.getenv("FILES_FOLDER", "files"),
                "labware",
                f"{p}.json",
            )
            for p in self.custom_labware
        ]

    @property
    def short_sha(self) -> str:
        """Short sha of the file."""
        # Hash the string using SHA-1
        hash_object = hashlib.sha1(self.file_stem.encode())
        # Convert to hexadecimal and truncate
        return hash_object.hexdigest()[:10]
