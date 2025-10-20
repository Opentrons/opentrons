"""opentrons_shared_data.data_files.types: types for data files."""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


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
    """Metadata info of a saved data file."""

    id: str
    name: str
    file_hash: str
    created_at: datetime
    source: DataFileSource
    mime_type: MimeType
    run_id: Optional[str]
    command_id: Optional[str]
    prev_command_id: Optional[str]
