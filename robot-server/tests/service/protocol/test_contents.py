from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest
from fastapi import UploadFile

from robot_server.service.protocol import contents, errors
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


@patch.object(contents, "TemporaryDirectory")
def test_create_temp_dir_error(mock_tempdir_constructor):
    """Test that create raises a ProtocolIOException if TemporyDirectory
    raises IOError"""
    def raiser(*args, **kwargs):
        raise IOError("failed")
    mock_tempdir_constructor.side_effect = raiser
    with pytest.raises(errors.ProtocolIOException):
        contents.create(None, None)


@patch.object(contents, "TemporaryDirectory")
@patch.object(contents, "save_upload")
def test_create_save_upload_error(mock_save_upload,
                                  mock_tempdir_constructor):
    """Test that save_upload raising IOError results in ProtocolIOException
    and removal of temporary directory."""
    # Mock created temporary directory
    mock_temp_dir = MagicMock()
    mock_temp_dir.name = "name"
    mock_tempdir_constructor.return_value = mock_temp_dir

    def raiser(*args, **kwargs):
        raise IOError("failed")
    # Save upload raises IOError
    mock_save_upload.side_effect = raiser

    with pytest.raises(errors.ProtocolIOException):
        contents.create(None, None)
    mock_temp_dir.cleanup.assert_called_once()
