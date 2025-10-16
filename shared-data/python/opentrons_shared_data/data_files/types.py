"""opentrons_shared_data.data_files.types: types for data files."""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


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
    run_id: Optional[str]
