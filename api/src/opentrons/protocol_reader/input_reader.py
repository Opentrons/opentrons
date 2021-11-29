"""Input file reading."""
from dataclasses import dataclass
from typing import List, Sequence

from .input_file import AbstractInputFile


@dataclass(frozen=True)
class BufferedFile:
    """A file that has been read into memory."""

    name: str
    contents: str


class InputReader:
    """Input file intake interface."""

    @staticmethod
    async def read(files: Sequence[AbstractInputFile]) -> List[BufferedFile]:
        """Read an input file into memeory."""
        raise NotImplementedError("InputReader not yet implemented")
