"""Model of a protocol for testing."""
import os
from pathlib import Path
from typing import Literal, Optional

from pydantic import BaseModel, Field

from automation.data.protocol_files import names
from automation.resources.robot_data import module_types


class Protocol(BaseModel):
    """Model to describe a protocol used in a test."""

    file_name: names = Field(description="file name not including extension")
    file_extension: Literal["json", "py"] = Field(description="file extension of the protocol")
    protocol_name: str = Field(description="the protocol name which will appear in the protocol name field in the app")
    robot: Literal["OT-2", "Flex"] = Field(description="the robot type which will appear in the robot field in the app")
    app_error: bool = Field(description="will analysis with the app raise an error")
    robot_error: bool = Field(description="will analysis with the robot raise an error")
    app_analysis_error: Optional[str] = Field(description="the exact error shown in the app popout", default=None)
    robot_analysis_error: Optional[str] = Field(description="the exact analysis error from the robot", default=None)
    custom_labware: Optional[list[str]] = Field(description="list of custom labware file stems", default=None)
    instruments: Optional[list[str]] = Field(description="list of instruments that will show in the app", default=None)
    modules: Optional[list[module_types]] = Field(description="list of modules that will show in the app", default=None)
    description: Optional[str] = Field(description="Details about this protocol", default=None)

    @property
    def file_path(self) -> Path:
        """Path of the file."""
        return Path(
            Path(__file__).resolve().parent.parent.parent,
            os.getenv("FILES_FOLDER", "files"),
            "protocols",
            f"{self.file_extension}",
            f"{self.file_name}.{self.file_extension}",
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
