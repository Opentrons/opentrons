"""Input file reading."""
from json import JSONDecodeError
from anyio import Path as AsyncPath, create_task_group, wrap_file
from dataclasses import dataclass
from pathlib import Path
from pydantic import ValidationError, parse_raw_as
from typing import List, Optional, Sequence, Union

from opentrons.protocols.models import JsonProtocol, LabwareDefinition

from .input_file import AbstractInputFile


# TODO(mc, 2021-12-07): add support for arbitrary JSON data files
BufferedJsonFileData = Union[JsonProtocol, LabwareDefinition]


@dataclass(frozen=True)
class BufferedFile:
    """A file that has been read into memory."""

    name: str
    contents: bytes
    data: Optional[BufferedJsonFileData]


class FileReadError(Exception):
    """An error raised if input files cannot be read."""


class FileReaderWriter:
    """Input file reader/writer interface."""

    @staticmethod
    async def read(files: Sequence[AbstractInputFile]) -> List[BufferedFile]:
        """Read a set of input files into memeory."""
        results: List[Optional[BufferedFile]] = [None for f in files]

        async def _read_file(input_file: AbstractInputFile, index: int) -> None:
            async with wrap_file(input_file.file) as f:
                contents = await f.read()
                data: Optional[BufferedJsonFileData] = None

                if input_file.filename.endswith(".json"):
                    try:
                        data = parse_raw_as(BufferedJsonFileData, contents)  # type: ignore[arg-type]  # noqa: E501
                    except (JSONDecodeError, ValidationError) as e:
                        raise FileReadError(
                            f"JSON file {input_file.filename} could not be parsed."
                        ) from e

                results[index] = BufferedFile(
                    name=input_file.filename,
                    contents=contents,
                    data=data,
                )

        async with create_task_group() as tg:
            for index, input_file in enumerate(files):
                tg.start_soon(_read_file, input_file, index)

        assert all(results), "Expected all files to be read"
        return [f for f in results if f]

    @staticmethod
    async def write(directory: Path, files: Sequence[BufferedFile]) -> None:
        """Write a set of previously buffered files to disk."""
        await AsyncPath(directory).mkdir(parents=True, exist_ok=True)

        async with create_task_group() as tg:
            for f in files:
                path = AsyncPath(directory / f.name)
                tg.start_soon(path.write_bytes, f.contents)
