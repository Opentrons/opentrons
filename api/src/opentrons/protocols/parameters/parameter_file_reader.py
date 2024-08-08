from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Optional, TextIO

from .exceptions import RuntimeParameterRequired


def open_file_path(file_path: Optional[Path]) -> TextIO:
    """Ensure file path is set and open up the file in a safe read-only temporary file."""
    if file_path is None:
        raise RuntimeParameterRequired(
            "CSV parameter needs to be set to a file for full analysis or run."
        )
    # Read the contents of the actual file
    with file_path.open() as fh:
        contents = fh.read()

    # Open a temporary file with write permissions and write contents to that
    temporary_file = NamedTemporaryFile("r+")
    temporary_file.write(contents)
    temporary_file.flush()

    # Open a new file handler for the temporary file with read-only permissions and close the other
    read_only_temp_file = open(temporary_file.name, "r")
    temporary_file.close()
    return read_only_temp_file
