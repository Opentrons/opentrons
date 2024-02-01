"""General utilities."""
from __future__ import annotations
import asyncio
import hashlib
from dataclasses import dataclass
from fastapi import UploadFile
from functools import wraps
from pathlib import Path
from types import TracebackType
from typing import cast, Any, Coroutine, Callable, Optional, Type, TypeVar
from typing_extensions import Final
from datetime import datetime, timezone


def _utc_now() -> datetime:
    """Return the current time in the UTC timezone."""
    return datetime.now(tz=timezone.utc)


class duration:
    """Context manager to mark start and end times of a block"""

    def __enter__(self) -> duration:
        self.start = _utc_now()
        return self

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        self.end = _utc_now()


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


_CALL_ONCE_TASK_ATTR: Final = "_call_once_task"


AsyncFuncT = TypeVar("AsyncFuncT", bound=Callable[..., Coroutine[Any, Any, Any]])


def call_once(fn: AsyncFuncT) -> AsyncFuncT:
    """
    Decorator used to ensure an async function is called only once. Subsequent
     calls will return the result of the initial call regardless of arguments.

     Intended for use in initializing a singleton.

    :param fn: a coroutine
    """

    @wraps(fn)
    async def wrapped(*args: Any, **kwargs: Any) -> Any:
        if not hasattr(wrapped, _CALL_ONCE_TASK_ATTR):
            setattr(
                wrapped, _CALL_ONCE_TASK_ATTR, asyncio.create_task(fn(*args, **kwargs))
            )

        result_task = getattr(wrapped, _CALL_ONCE_TASK_ATTR)
        return await result_task

    return cast(AsyncFuncT, wrapped)
