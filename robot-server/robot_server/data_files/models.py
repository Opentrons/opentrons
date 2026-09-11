"""Data files models."""

from datetime import datetime
from typing import Literal, Optional, Set

from pydantic import BaseModel, Field

from opentrons_shared_data.data_files import DataFileSource, MimeType
from opentrons_shared_data.errors import GeneralError
from server_utils.fastapi_utils.models.json_api import ResourceModel

from robot_server.errors.error_responses import ErrorDetails


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


class FileNotFound(ErrorDetails):
    """An error returned when specified file path was not found on the robot."""

    id: Literal["FileNotFound"] = "FileNotFound"
    title: str = "Specified file path not found on the robot"


class NoImagesFound(ErrorDetails):
    """An error returned when no images are found for the specified run."""

    id: Literal["NoImagesFound"] = "NoImagesFound"
    title: str = "No images found for run"


class ImageFileMetadata(BaseModel):
    """Metadata associated with a particular image file captured by a camera during a run."""

    id: str = Field(
        ...,
        description="The id of the camera image file."
        " This id is identical to the filename of the camera image file.",
    )
    filename: str = Field(..., description="The name of the data file.")
    cameraId: str = Field(
        ..., description="The ID of the camera used to capture the image file."
    )
    commandId: Optional[str] = Field(
        ...,
        description="The command ID of the command that generated the image file, if any.",
    )
    prevCommandId: Optional[str] = Field(
        ...,
        description="The command ID of the command immediately before the command"
        " that generated the image file, if any.",
    )
    createdAt: datetime = Field(
        ..., description="The time the camera image file was created."
    )


class DataFileMetadataResponse(BaseModel):
    """Response model for data file metadata without command information."""

    id: str = Field(..., description="A unique identifier for this file.")
    filename: str = Field(..., description="The name of the data file.")
    stored: bool = Field(..., description="Whether the file is currently stored.")
    generated: bool = Field(
        ..., description="Whether the file was generated as output during a run."
    )
    mimeType: MimeType = Field(..., description="MIME type of the file.")
