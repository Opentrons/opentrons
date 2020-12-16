from pathlib import Path

import pytest
from fastapi import UploadFile

from robot_server.service.protocol import contents
from robot_server.service.protocol.errors import ProtocolAlreadyExistsException


@pytest.fixture(scope="module")
def contents_fixture() -> contents.Contents:
    return contents.create(
        protocol_file=UploadFile(filename="test_contents.py"),
        support_files=[UploadFile(filename="test_environment.py")]
    )


def test_directory_creation(contents_fixture):
    """Test that directory exists."""
    file_names = set(f.name for f in
                     Path(contents_fixture.directory.name).iterdir())
    assert len(file_names) == 2
    assert "test_contents.py" in file_names
    assert "test_environment.py" in file_names


def test_add_already_exists(contents_fixture):
    with pytest.raises(ProtocolAlreadyExistsException):
        contents.add(contents_fixture, UploadFile(filename="test_contents.py"))


def test_add(contents_fixture):
    contents.add(contents_fixture, UploadFile(filename="test_contents2.py"))
    file_names = set(f.name for f in
                     Path(contents_fixture.directory.name).iterdir())
    assert len(file_names) == 3
    assert "test_contents2.py" in file_names


def test_cleanup(contents_fixture):
    contents.clean_up(contents_fixture)
    assert Path(contents_fixture.directory.name).exists() is False
