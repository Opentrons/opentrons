from __future__ import annotations
import hashlib
from dataclasses import dataclass
from fastapi import UploadFile
from functools import wraps
from pathlib import Path
from types import TracebackType
from typing import cast, Any, Awaitable, Callable, Optional, Type, TypeVar
from typing_extensions import Final

from opentrons.util.helpers import utc_now


class duration:
    """Context manager to mark start and end times of a block"""

    def __enter__(self) -> duration:
        self.start = utc_now()
        return self

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
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
    with path.open("wb") as p:
        p.write(contents)

    return FileMeta(path=path, content_hash=content_hash)


CALL_ONCE_RESULT_ATTR: Final = "_call_once_result"

AsyncFuncT = TypeVar("AsyncFuncT", bound=Callable[..., Awaitable[Any]])


def call_once(fn: AsyncFuncT) -> AsyncFuncT:
    """
    Decorator used to ensure an async function is called only once. Subsequent
     calls will return the result of ths initial call regardless of arguments.

     Intended for use in initializing a singleton.

    :param fn: a coroutine
    """

    @wraps(fn)
    async def wrapped(*args: Any, **kwargs: Any) -> Any:
        if not hasattr(wrapped, CALL_ONCE_RESULT_ATTR):
            result = await fn(*args, **kwargs)
            setattr(wrapped, CALL_ONCE_RESULT_ATTR, result)

        return getattr(wrapped, CALL_ONCE_RESULT_ATTR)

    return cast(AsyncFuncT, wrapped)
