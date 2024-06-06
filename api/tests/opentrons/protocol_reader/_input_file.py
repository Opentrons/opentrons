from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import BinaryIO

from opentrons.protocol_reader import AbstractInputFile


@dataclass(frozen=True)
class InputFile(AbstractInputFile):
    """An implementation of AbstractInputFile to use for test input."""

    filename: str
    file: BinaryIO

    @classmethod
    def make(cls, filename: str, contents: bytes) -> InputFile:
        """Build a new InputFile with the given filename and contents."""
        return cls(filename=filename, file=BytesIO(contents))
