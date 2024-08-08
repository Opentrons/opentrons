import pytest
import platform

from opentrons_shared_data import get_shared_data_root, load_shared_data

from opentrons.protocols.parameters.exceptions import RuntimeParameterRequired
from opentrons.protocols.parameters import parameter_file_reader as subject


def test_open_file_path() -> None:
    """It should open a temporary file handler given a path."""
    contents = load_shared_data("protocol/fixtures/7/simpleV7.json")
    shared_data_path = get_shared_data_root() / "protocol/fixtures/7/simpleV7.json"

    # On Windows, you can't open a NamedTemporaryFile a second time, which breaks the code under test.
    # Because of the way CSV analysis works this code will only ever be run on the actual OT-2/Flex hardware,
    # so we skip testing and instead assert that we get a PermissionError on Windows (to ensure this
    # test gets fixed in case we ever refactor the file opening.)
    if platform.system() != "Windows":
        result = subject.open_file_path(shared_data_path)

        assert result.readable()
        assert not result.writable()
        assert result.read() == contents.decode("utf-8")
        result.close()
    else:
        with pytest.raises(PermissionError):
            subject.open_file_path(shared_data_path)


def test_open_file_path_raises() -> None:
    """It should raise of no file path is provided."""
    with pytest.raises(RuntimeParameterRequired):
        subject.open_file_path(None)
