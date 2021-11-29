"""Write protocol files to disk."""
from pathlib import Path
from typing import Sequence

from .input_reader import BufferedFile


class FileWriter:
    """File writing interface."""

    @staticmethod
    async def write(directory: Path, files: Sequence[BufferedFile]) -> None:
        """Write a previously buffered file to disk."""
        raise NotImplementedError("FileWriter not yet implemented")
