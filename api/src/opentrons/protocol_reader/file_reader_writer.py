"""Input file reading."""
from json import JSONDecodeError
from anyio import Path as AsyncPath, create_task_group, wrap_file
from dataclasses import dataclass
from pathlib import Path
from pydantic import ValidationError, parse_raw_as
from typing import List, Optional, Sequence, Union

from opentrons_shared_data.protocol.models import ProtocolSchemaV6

from opentrons.protocols.models import JsonProtocol, LabwareDefinition

from .input_file import AbstractInputFile


# TODO(mc, 2021-12-07): add support for arbitrary JSON data files
BufferedJsonFileData = Union[JsonProtocol, LabwareDefinition, ProtocolSchemaV6]


# TODO(mc, 2021-12-07): re-evaluate if JSON parsing (and this `data` field)
# are really conceptually appropriate for this unit. The answer is likely
# "no", especially if we need to make perf. improvements to parsing
@dataclass(frozen=True)
class BufferedFile:
    """A file that has been read into memory."""

    name: str
    contents: bytes
    path: Optional[Path]
    data: Optional[BufferedJsonFileData]


class FileReadError(Exception):
    """An error raised if input files cannot be read."""


class FileReaderWriter:
    """Input file reader/writer interface."""

    @staticmethod
    async def read(
        files: Sequence[Union[AbstractInputFile, Path]]
    ) -> List[BufferedFile]:
        """Read a set of input files into memory."""
        results: List[Optional[BufferedFile]] = [None for f in files]

        async def _read_file(
            input_file: Union[AbstractInputFile, Path], index: int
        ) -> None:
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

            data: Optional[BufferedJsonFileData] = None

            if filename.lower().endswith(".json"):
                try:
                    data = parse_raw_as(BufferedJsonFileData, contents)  # type: ignore[arg-type]

                # unlike other Pydantic functions/methods, `parse_raw_as` can
                # raise both JSONDecodeError and ValidationError separately
                except JSONDecodeError as e:
                    raise FileReadError(f"{filename} is not valid JSON.") from e

                except ValidationError as e:
                    raise FileReadError(
                        f"JSON file {filename} did not"
                        " match a known Opentrons format."
                    ) from e

            results[index] = BufferedFile(
                name=filename,
                contents=contents,
                data=data,
                path=path,
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
