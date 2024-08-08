import pytest
import inspect
from decoy import Decoy
from pytest_lazyfixture import lazy_fixture  # type: ignore[import-untyped]

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons.protocols.parameters import (
    parameter_file_reader as mock_param_file_reader,
)
from opentrons.protocols.parameters.csv_parameter_interface import CSVParameter


@pytest.fixture(autouse=True)
def _patch_parameter_file_reader(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(mock_param_file_reader, inspect.isfunction):
        monkeypatch.setattr(mock_param_file_reader, name, decoy.mock(func=func))


@pytest.fixture
def api_version() -> APIVersion:
    """The API version under test."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def csv_file_basic() -> bytes:
    """A basic CSV file with quotes around strings."""
    return b'"x","y","z"\n"a",1,2\n"b",3,4\n"c",5,6'


@pytest.fixture
def csv_file_no_quotes() -> bytes:
    """A basic CSV file with no quotes around strings."""
    return b"x,y,z\na,1,2\nb,3,4\nc,5,6"


@pytest.fixture
def csv_file_preceding_spaces() -> bytes:
    """A basic CSV file with quotes around strings and spaces preceding non-initial columns."""
    return b'"x", "y", "z"\n"a", 1, 2\n"b", 3, 4\n"c", 5, 6'


@pytest.fixture
def csv_file_mixed_quotes() -> bytes:
    """A basic CSV file with both string quotes and escaped quotes."""
    return b'head,er\n"a,b,c",def\n"""ghi""","jkl"'


@pytest.fixture
def csv_file_different_delimiter() -> bytes:
    """A basic CSV file with a non-comma delimiter."""
    return b"x:y:z\na,:1,:2\nb,:3,:4\nc,:5,:6"


def test_csv_parameter(
    decoy: Decoy, api_version: APIVersion, csv_file_basic: bytes
) -> None:
    """It should load the CSV parameter and provide access to the file, contents, and rows."""
    subject = CSVParameter(csv_file_basic, api_version)

    assert subject.file.read() == '"x","y","z"\n"a",1,2\n"b",3,4\n"c",5,6'
    assert subject.contents == '"x","y","z"\n"a",1,2\n"b",3,4\n"c",5,6'
    assert subject.parse_as_csv()[0] == ["x", "y", "z"]


@pytest.mark.parametrize(
    "csv_file",
    [
        lazy_fixture("csv_file_basic"),
        lazy_fixture("csv_file_no_quotes"),
        lazy_fixture("csv_file_preceding_spaces"),
    ],
)
def test_csv_parameter_rows(
    decoy: Decoy,
    api_version: APIVersion,
    csv_file: bytes,
) -> None:
    """It should load the rows as all strings even with no quotes or leading spaces."""
    subject = CSVParameter(csv_file, api_version)

    assert len(subject.parse_as_csv()) == 4
    assert subject.parse_as_csv()[0] == ["x", "y", "z"]
    assert subject.parse_as_csv()[1] == ["a", "1", "2"]


def test_csv_parameter_mixed_quotes(
    decoy: Decoy,
    api_version: APIVersion,
    csv_file_mixed_quotes: bytes,
) -> None:
    """It should load the rows with no quotes, quotes and escaped quotes with double quotes."""
    subject = CSVParameter(csv_file_mixed_quotes, api_version)

    assert len(subject.parse_as_csv()) == 3
    assert subject.parse_as_csv()[0] == ["head", "er"]
    assert subject.parse_as_csv()[1] == ["a,b,c", "def"]
    assert subject.parse_as_csv()[2] == ['"ghi"', "jkl"]


def test_csv_parameter_additional_kwargs(
    decoy: Decoy,
    api_version: APIVersion,
    csv_file_different_delimiter: bytes,
) -> None:
    """It should load the rows with a different delimiter."""
    subject = CSVParameter(csv_file_different_delimiter, api_version)
    rows = subject.parse_as_csv(delimiter=":")

    assert len(rows) == 4
    assert rows[0] == ["x", "y", "z"]
    assert rows[1] == ["a,", "1,", "2"]


def test_csv_parameter_dont_detect_dialect(
    decoy: Decoy,
    api_version: APIVersion,
    csv_file_preceding_spaces: bytes,
) -> None:
    """It should load the rows without trying to detect the dialect."""
    subject = CSVParameter(csv_file_preceding_spaces, api_version)
    rows = subject.parse_as_csv(detect_dialect=False)

    assert rows[0] == ["x", ' "y"', ' "z"']
    assert rows[1] == ["a", " 1", " 2"]
