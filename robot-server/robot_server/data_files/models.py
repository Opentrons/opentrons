"""Data files models."""
from datetime import datetime
from typing import Literal, Set
from enum import Enum

from pydantic import Field

from opentrons_shared_data.errors import GeneralError

from robot_server.errors.error_responses import ErrorDetails
from robot_server.service.json_api import ResourceModel


class DataFileSource(Enum):
    """The source this data file is from."""

    UPLOADED = "uploaded"
    GENERATED = "generated"


class DataFile(ResourceModel):
    """A model representing a data file."""

    id: str = Field(..., description="A unique identifier for this file.")
    name: str = Field(..., description="Name of the data file.")
    source: DataFileSource = Field(
        ..., description="The origin of the file (uploaded or generated)"
    )
    createdAt: datetime = Field(
        ..., description="When this data file was uploaded or generated.."
    )


class FileIdNotFoundError(GeneralError):
    """Error raised when a given file ID is not found in the store."""

    def __init__(self, data_file_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(
            message=f"Data file {data_file_id} was not found.",
            detail={"dataFileId": data_file_id},
        )


class FileInUseError(GeneralError):
    """Error raised when a file being removed is in use."""

    def __init__(
        self,
        data_file_id: str,
        ids_used_in_runs: Set[str],
        ids_used_in_analyses: Set[str],
    ) -> None:
        analysis_usage_text = (
            f" analyses: {ids_used_in_analyses}"
            if len(ids_used_in_analyses) > 0
            else None
        )
        runs_usage_text = (
            f" runs: {ids_used_in_runs}" if len(ids_used_in_runs) > 0 else None
        )
        conjunction = " and " if analysis_usage_text and runs_usage_text else ""
        message = (
            f"Cannot remove file {data_file_id} as it is being used in"
            f" existing{analysis_usage_text or ''}{conjunction}{runs_usage_text or ''}."
        )
        super().__init__(
            message=message,
            detail={"dataFileId": data_file_id},
        )


class FileIdNotFound(ErrorDetails):
    """An error returned when specified file id was not found on the robot."""

    id: Literal["FileIdNotFound"] = "FileIdNotFound"
    title: str = "Specified file id not found on the robot"
