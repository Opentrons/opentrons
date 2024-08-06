import pytest
import inspect
from decoy import Decoy
from pytest_lazyfixture import lazy_fixture  # type: ignore[import-untyped]

import tempfile
from pathlib import Path
from typing import TextIO, Generator

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
def csv_file_basic() -> Generator[TextIO, None, None]:
    """A basic CSV file with quotes around strings."""
    with tempfile.TemporaryFile("r+") as temp_file:
        contents = '"x","y","z"\n"a",1,2\n"b",3,4\n"c",5,6'
        temp_file.write(contents)
        temp_file.seek(0)
        yield temp_file


@pytest.fixture
def csv_file_no_quotes() -> Generator[TextIO, None, None]:
    """A basic CSV file with no quotes around strings."""
    with tempfile.TemporaryFile("r+") as temp_file:
        contents = "x,y,z\na,1,2\nb,3,4\nc,5,6"
        temp_file.write(contents)
        temp_file.seek(0)
        yield temp_file


@pytest.fixture
def csv_file_preceding_spaces() -> Generator[TextIO, None, None]:
    """A basic CSV file with quotes around strings and spaces preceding non-initial columns."""
    with tempfile.TemporaryFile("r+") as temp_file:
        contents = '"x", "y", "z"\n"a", 1, 2\n"b", 3, 4\n"c", 5, 6'
        temp_file.write(contents)
        temp_file.seek(0)
        yield temp_file


@pytest.fixture
def csv_file_mixed_quotes() -> Generator[TextIO, None, None]:
    """A basic CSV file with both string quotes and escaped quotes."""
    with tempfile.TemporaryFile("r+") as temp_file:
        contents = 'head,er\n"a,b,c",def\n"""ghi""","jkl"'
        temp_file.write(contents)
        temp_file.seek(0)
        yield temp_file


@pytest.fixture
def csv_file_different_delimiter() -> Generator[TextIO, None, None]:
    """A basic CSV file with a non-comma delimiter."""
    with tempfile.TemporaryFile("r+") as temp_file:
        contents = "x:y:z\na,:1,:2\nb,:3,:4\nc,:5,:6"
        temp_file.write(contents)
        temp_file.seek(0)
        yield temp_file


@pytest.fixture
def subject(api_version: APIVersion) -> CSVParameter:
    """Return a CSVParameter interface subject."""
    return CSVParameter(csv_path=Path("abc"), api_version=api_version)


def test_csv_parameter(
    decoy: Decoy, csv_file_basic: TextIO, subject: CSVParameter
) -> None:
    """It should load the CSV parameter and provide access to the file, contents, and rows."""
    decoy.when(mock_param_file_reader.open_file_path(Path("abc"))).then_return(
        csv_file_basic
    )
    assert subject.file is csv_file_basic
    assert subject.contents == '"x","y","z"\n"a",1,2\n"b",3,4\n"c",5,6'


@pytest.mark.parametrize(
    "csv_file",
    [
        lazy_fixture("csv_file_basic"),
        lazy_fixture("csv_file_no_quotes"),
        lazy_fixture("csv_file_preceding_spaces"),
    ],
)
def test_csv_parameter_rows(
    decoy: Decoy, csv_file: TextIO, subject: CSVParameter
) -> None:
    """It should load the rows as all strings even with no quotes or leading spaces."""
    decoy.when(mock_param_file_reader.open_file_path(Path("abc"))).then_return(csv_file)
    assert len(subject.parse_as_csv()) == 4
    assert subject.parse_as_csv()[0] == ["x", "y", "z"]
    assert subject.parse_as_csv()[1] == ["a", "1", "2"]


def test_csv_parameter_mixed_quotes(
    decoy: Decoy, csv_file_mixed_quotes: TextIO, subject: CSVParameter
) -> None:
    """It should load the rows with no quotes, quotes and escaped quotes with double quotes."""
    decoy.when(mock_param_file_reader.open_file_path(Path("abc"))).then_return(
        csv_file_mixed_quotes
    )
    assert len(subject.parse_as_csv()) == 3
    assert subject.parse_as_csv()[0] == ["head", "er"]
    assert subject.parse_as_csv()[1] == ["a,b,c", "def"]
    assert subject.parse_as_csv()[2] == ['"ghi"', "jkl"]


def test_csv_parameter_additional_kwargs(
    decoy: Decoy, csv_file_different_delimiter: TextIO, subject: CSVParameter
) -> None:
    """It should load the rows with a different delimiter."""
    decoy.when(mock_param_file_reader.open_file_path(Path("abc"))).then_return(
        csv_file_different_delimiter
    )
    rows = subject.parse_as_csv(delimiter=":")
    assert len(rows) == 4
    assert rows[0] == ["x", "y", "z"]
    assert rows[1] == ["a,", "1,", "2"]


def test_csv_parameter_dont_detect_dialect(
    decoy: Decoy, csv_file_preceding_spaces: TextIO, subject: CSVParameter
) -> None:
    """It should load the rows without trying to detect the dialect."""
    decoy.when(mock_param_file_reader.open_file_path(Path("abc"))).then_return(
        csv_file_preceding_spaces
    )
    rows = subject.parse_as_csv(detect_dialect=False)
    assert rows[0] == ["x", ' "y"', ' "z"']
    assert rows[1] == ["a", " 1", " 2"]
