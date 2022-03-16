"""Input file value objects."""
from dataclasses import dataclass
from typing import IO
from typing_extensions import Protocol as InterfaceShape


class AbstractInputFile(InterfaceShape):
    """An individual file to be read as part of a protocol.

    Properties:
        filename: The basename, including extension, of the file.
        file: A [file](https://docs.python.org/3/glossary.html#term-file-object)
            providing the contents of the protocol to be read.
    """

    filename: str
    file: IO[bytes]


@dataclass(frozen=True)
class InputFile(AbstractInputFile):
    """Concrete input file data model."""

    filename: str
    file: IO[bytes]
