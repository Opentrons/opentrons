import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import-untyped]

import tempfile
from typing import TextIO

from opentrons.protocols.parameters.types import CSVParameter


@pytest.fixture
def csv_file_basic() -> TextIO:
    temp_file = tempfile.TemporaryFile("r+")
    contents = '"x","y","z"\n"a",1,2\n"b",3,4\n"c",5,6'
    temp_file.write(contents)
    temp_file.seek(0)
    return temp_file


@pytest.fixture
def csv_file_no_quotes() -> TextIO:
    temp_file = tempfile.TemporaryFile("r+")
    contents = "x,y,z\na,1,2\nb,3,4\nc,5,6"
    temp_file.write(contents)
    temp_file.seek(0)
    return temp_file


@pytest.fixture
def csv_file_preceding_spaces() -> TextIO:
    temp_file = tempfile.TemporaryFile("r+")
    contents = '"x", "y", "z"\n"a", 1, 2\n"b", 3, 4\n"c", 5, 6'
    temp_file.write(contents)
    temp_file.seek(0)
    return temp_file


@pytest.fixture
def csv_file_mixed_quotes() -> TextIO:
    temp_file = tempfile.TemporaryFile("r+")
    contents = 'head,er\n"a,b,c",def\n"""ghi""","jkl"'
    temp_file.write(contents)
    temp_file.seek(0)
    return temp_file


def test_csv_parameter(csv_file_basic: TextIO) -> None:
    """It should load the CSV parameter and provide access to the file, contents, and rows."""
    subject = CSVParameter(csv_file_basic)
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
def test_csv_parameter_rows(csv_file: TextIO) -> None:
    """It should load the rows as all strings even with no quotes or leading spaces."""
    subject = CSVParameter(csv_file)
    assert len(subject.rows()) == 4
    assert subject.rows()[0] == ["x", "y", "z"]
    assert subject.rows()[1] == ["a", "1", "2"]


def test_csv_parameter_mixed_quotes(csv_file_mixed_quotes: TextIO) -> None:
    """It should load the rows with no quotes, quotes and escaped quotes with double quotes."""
    subject = CSVParameter(csv_file_mixed_quotes)
    assert len(subject.rows()) == 3
    assert subject.rows()[0] == ["head", "er"]
    assert subject.rows()[1] == ["a,b,c", "def"]
    assert subject.rows()[2] == ['"ghi"', "jkl"]
