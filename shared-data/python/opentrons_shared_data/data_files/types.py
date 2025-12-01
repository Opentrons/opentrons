"""opentrons_shared_data.data_files.types: types for data files."""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Union, Optional


@dataclass(frozen=True)
class RunFileNameMetadata:
    """Data from the run used that may be used to build a finalized file name."""

    robot_name: str
    run_id: str
    run_created_at: datetime
    protocol_name: Optional[str]


class MimeType(str, Enum):
    """File mime types."""

    TEXT_CSV = "text/csv"
    IMAGE_JPEG = "image/jpeg"


class DataFileSource(Enum):
    """The source this data file is from."""

    UPLOADED = "uploaded"
    GENERATED = "generated"


@dataclass(frozen=True)
class DataFileInfo:
    """Metadata about a data file."""

    id: str
    name: str
    path: str
    stored: bool
    generated: bool
    file_hash: str
    mime_type: MimeType
    created_at: datetime


@dataclass(frozen=True)
class CmdDataFileInfo:
    """Command metadata info utilized by data files."""

    command_id: str
    prev_command_id: str


@dataclass(frozen=True)
class DataFileInfoWithCommands(DataFileInfo):
    """Data file info with associated command information."""

    command_info: CmdDataFileInfo


@dataclass(frozen=True)
class BaseInputOutputDataFileInfo:
    """Base metadata info for data files acting as input or output to a run."""

    run_id: str
    file_id: str


@dataclass(frozen=True)
class InputDataFileInfo(BaseInputOutputDataFileInfo):
    """Metadata of a data file used as input to a run."""

    command_info: None


@dataclass(frozen=True)
class OutputDataFileInfo(BaseInputOutputDataFileInfo):
    """Metadata of a data file used as output from a run."""

    command_info: CmdDataFileInfo


IODataFileInfo = Union[InputDataFileInfo, OutputDataFileInfo]
