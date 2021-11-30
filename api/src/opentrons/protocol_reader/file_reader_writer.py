"""Input file reading."""
from anyio import Path as AsyncPath, create_task_group, wrap_file
from pathlib import Path
from typing import List, Optional, Sequence

from .input_file import AbstractInputFile, BufferedFile


class FileReaderWriter:
    """Input file reader/writer interface."""

    @staticmethod
    async def read(files: Sequence[AbstractInputFile]) -> List[BufferedFile]:
        """Read a set of input files into memeory."""
        results: List[Optional[BufferedFile]] = [None for f in files]

        async def _read_file(input_file: AbstractInputFile, index: int) -> None:
            async with wrap_file(input_file.file) as f:
                contents = await f.read()
                buffered = BufferedFile(name=input_file.filename, contents=contents)
                results[index] = buffered

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
