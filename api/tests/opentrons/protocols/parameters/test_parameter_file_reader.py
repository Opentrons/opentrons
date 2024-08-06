import pytest
from pathlib import Path
from tempfile import NamedTemporaryFile

from opentrons.protocols.parameters.exceptions import RuntimeParameterRequired
from opentrons.protocols.parameters import parameter_file_reader as subject


def test_open_file_path() -> None:
    """It should open a temporary file handler given a path."""
    with NamedTemporaryFile("r+") as file_to_open:
        file_to_open.write("Hello World\n")
        file_to_open.flush()

        result = subject.open_file_path(Path(file_to_open.name))

        assert result.readable()
        assert not result.writable()
        assert result.read() == "Hello World\n"
        result.close()


def test_open_file_path_raises() -> None:
    """It should raise of no file path is provided."""
    with pytest.raises(RuntimeParameterRequired):
        subject.open_file_path(None)
