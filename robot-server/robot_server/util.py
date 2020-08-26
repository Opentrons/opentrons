import hashlib
from dataclasses import dataclass
from pathlib import Path

from fastapi import UploadFile
from opentrons.util.helpers import utc_now


class duration:
    """Context manager to mark start and end times of a block"""

    def __enter__(self):
        self.start = utc_now()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end = utc_now()


@dataclass(frozen=True)
class FileMeta:
    path: Path
    content_hash: str


def save_upload(directory: Path, upload_file: UploadFile) -> FileMeta:
    """Save an uploaded file."""
    path = directory / upload_file.filename

    contents = upload_file.file.read()
    content_hash = hashlib.sha256(contents).hexdigest()

    # write contents to file
    with path.open('wb') as p:
        p.write(contents)

    return FileMeta(path=path, content_hash=content_hash)
