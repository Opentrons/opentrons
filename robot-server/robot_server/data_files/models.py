"""Data files models."""
from datetime import datetime
from typing import Literal

from pydantic import Field

from opentrons_shared_data.errors import GeneralError

from robot_server.errors.error_responses import ErrorDetails
from robot_server.service.json_api import ResourceModel


class DataFile(ResourceModel):
    """A model representing an uploaded data file."""

    id: str = Field(..., description="A unique identifier for this file.")
    name: str = Field(..., description="Name of the uploaded file.")
    createdAt: datetime = Field(..., description="When this data file was *uploaded*.")


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

    def __init__(self, data_file_id: str, message: str) -> None:
        super().__init__(
            message=message,
            detail={"dataFileId": data_file_id},
        )


class FileIdNotFound(ErrorDetails):
    """An error returned when specified file id was not found on the robot."""

    id: Literal["FileIdNotFound"] = "FileIdNotFound"
    title: str = "Specified file id not found on the robot"
