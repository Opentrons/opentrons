"""Input file reading."""

import os
import pathlib
import platform
from dataclasses import dataclass
from typing import List, Optional, Sequence, Union

import anyio

from .input_file import AbstractInputFile
from .protocol_files_invalid_error import ProtocolFilesInvalidError


@dataclass(frozen=True)
class BufferedFile:
    """A file that has been read into memory."""

    name: str
    contents: bytes
    path: Optional[pathlib.Path]


class FileReadError(ProtocolFilesInvalidError):
    """An error raised if input files cannot be read."""


class FileReaderWriter:
    """Input file reader/writer interface."""

    @staticmethod
    async def read(
        files: Sequence[Union[AbstractInputFile, pathlib.Path]]
    ) -> List[BufferedFile]:
        """Read a set of input files into memory."""
        return [await _read_file(input_file=file) for file in files]

    @staticmethod
    async def write(directory: pathlib.Path, files: Sequence[BufferedFile]) -> None:
        """Write a set of previously buffered files to disk."""
        await anyio.Path(directory).mkdir(parents=True, exist_ok=True)

        for file in files:
            path = directory / file.name
            await _write_and_fsync_file(path=path, contents=file.contents)

        await _fsync_directory(path=directory)


async def _read_file(
    input_file: Union[AbstractInputFile, pathlib.Path]
) -> BufferedFile:
    if isinstance(input_file, pathlib.Path):
        path: Optional[pathlib.Path] = input_file
        filename = input_file.name
        contents = await anyio.Path(input_file).read_bytes()
    elif not input_file.filename:
        raise FileReadError("File was missing a name")
    else:
        path = None
        filename = input_file.filename
        async with anyio.wrap_file(input_file.file) as f:
            contents = await f.read()

    return BufferedFile(
        name=filename,
        contents=contents,
        path=path,
    )


async def _write_and_fsync_file(path: pathlib.Path, contents: bytes) -> None:
    async with await anyio.open_file(path, "wb") as file:
        await file.write(contents)
        await file.flush()
        await anyio.to_thread.run_sync(os.fsync, file.wrapped.fileno())


async def _fsync_directory(path: pathlib.Path) -> None:
    def _fsync_directory_sync() -> None:
        # We can't fsync directories on Windows because doing os.open() on them raises
        # PermissionError. https://stackoverflow.com/questions/21785127
        if platform.system() != "Windows":
            fd = os.open(path, os.O_RDONLY)
            try:
                os.fsync(fd)
            finally:
                os.close(fd)

    await anyio.to_thread.run_sync(_fsync_directory_sync)
