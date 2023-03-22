"""Input file reading."""

import os
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Sequence, Union

from anyio import (
    create_task_group,
    to_thread,
    Path as AsyncPath,
    wrap_file as wrap_file_async,
    open_file as open_file_async,
)

from .input_file import AbstractInputFile
from .protocol_files_invalid_error import ProtocolFilesInvalidError


@dataclass(frozen=True)
class BufferedFile:
    """A file that has been read into memory."""

    name: str
    contents: bytes
    path: Optional[Path]


class FileReadError(ProtocolFilesInvalidError):
    """An error raised if input files cannot be read."""


class FileReaderWriter:
    """Input file reader/writer interface."""

    @staticmethod
    async def read(
        files: Sequence[Union[AbstractInputFile, Path]]
    ) -> List[BufferedFile]:
        """Read a set of input files into memory."""
        return [await _read_file(input_file=file) for file in files]

    @staticmethod
    async def write(directory: Path, files: Sequence[BufferedFile]) -> None:
        """Write a set of previously buffered files to disk."""
        await AsyncPath(directory).mkdir(parents=True, exist_ok=True)

        for file in files:
            path = directory / file.name
            await _write_and_fsync_file(path=path, contents=file.contents)

        await _fsync_directory(path=directory)


async def _read_file(input_file: Union[AbstractInputFile, Path]) -> BufferedFile:
    if isinstance(input_file, Path):
        path: Optional[Path] = input_file
        filename = input_file.name
        contents = await AsyncPath(input_file).read_bytes()
    elif not input_file.filename:
        raise FileReadError("File was missing a name")
    else:
        path = None
        filename = input_file.filename
        async with wrap_file_async(input_file.file) as f:
            contents = await f.read()

    return BufferedFile(
        name=filename,
        contents=contents,
        path=path,
    )


async def _write_and_fsync_file(path: Path, contents: bytes) -> None:
    async with await open_file_async(path, "wb") as file:
        await file.write(contents)
        await file.flush()
        await to_thread.run_sync(os.fsync, file.wrapped.fileno())


async def _fsync_directory(path: Path) -> None:
    def _fsync_directory_sync() -> None:
        fd = os.open(path, os.O_RDONLY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)

    await to_thread.run_sync(_fsync_directory_sync)
