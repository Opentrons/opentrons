"""Input file reading."""
import enum
from json import JSONDecodeError
from anyio import Path as AsyncPath, create_task_group, wrap_file
from dataclasses import dataclass
from pathlib import Path
from pydantic import ValidationError, parse_raw_as
from typing import List, Optional, Sequence, Union

from opentrons_shared_data.protocol.models import ProtocolSchemaV6

from opentrons.protocols.models import JsonProtocol, LabwareDefinition

from .input_file import AbstractInputFile


@dataclass(frozen=True)
class BufferedFile:
    """A file that has been read into memory."""

    name: str
    contents: bytes
    path: Optional[Path]


class FileReadError(Exception):
    """An error raised if input files cannot be read."""


class FileReaderWriter:
    """Input file reader/writer interface."""

    @classmethod
    async def read(
        cls, files: Sequence[Union[AbstractInputFile, Path]]
    ) -> List[BufferedFile]:
        """Read a set of input files into memory."""
        return [await cls._read_file(input_file=file) for file in files]

    @staticmethod
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
            async with wrap_file(input_file.file) as f:
                contents = await f.read()

        return BufferedFile(
            name=filename,
            contents=contents,
            path=path,
        )

    @staticmethod
    async def write(directory: Path, files: Sequence[BufferedFile]) -> None:
        """Write a set of previously buffered files to disk."""
        await AsyncPath(directory).mkdir(parents=True, exist_ok=True)

        async with create_task_group() as tg:
            for f in files:
                path = AsyncPath(directory / f.name)
                tg.start_soon(path.write_bytes, f.contents)
