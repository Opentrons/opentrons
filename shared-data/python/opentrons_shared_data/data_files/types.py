from dataclasses import dataclass
from datetime import datetime
from enum import Enum


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
