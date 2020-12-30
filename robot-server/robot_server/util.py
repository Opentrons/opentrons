import hashlib
from dataclasses import dataclass
from functools import wraps
from pathlib import Path

from fastapi import UploadFile
from opentrons.util.helpers import utc_now
from typing_extensions import Final


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


CACHED_RESULT_ATTR: Final = "_cached_result"


def cache_result(fn):
    """
    Decorator used to cache the result of an async function. Intended for use
    in initializing a singleton.

    The wrapped function will be called once regardless of arguments.

    :param fn: a coroutine
    """
    @wraps(fn)
    async def wrapped(*args, **kwargs):
        if not hasattr(wrapped, CACHED_RESULT_ATTR):
            result = await fn(*args, **kwargs)
            setattr(wrapped, CACHED_RESULT_ATTR, result)

        return getattr(wrapped, CACHED_RESULT_ATTR)

    return wrapped
