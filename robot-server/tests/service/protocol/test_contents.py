from pathlib import Path
from mock import patch, MagicMock

import pytest
from fastapi import UploadFile

from robot_server.service.protocol import contents, errors


@pytest.fixture
def mock_tempdir():
    mock_temp_dir = MagicMock()
    mock_temp_dir.name = "temp_dir_name"
    return mock_temp_dir


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
def test_create_save_upload_error(
    mock_save_upload, mock_tempdir_constructor, mock_tempdir
):
    """Test that save_upload raising IOError results in ProtocolIOException
    and removal of temporary directory."""
    mock_tempdir_constructor.return_value = mock_tempdir

    def raiser(*args, **kwargs):
        raise IOError("failed")

    # Save upload raises IOError
    mock_save_upload.side_effect = raiser

    with pytest.raises(errors.ProtocolIOException):
        contents.create(None, None)
    mock_tempdir.cleanup.assert_called_once()


@patch.object(contents, "save_upload")
def test_update_raises_error(mock_save_upload, mock_tempdir):
    """That updating the protocol will raise an error on IOException."""

    def raiser(*args, **kwargs):
        raise IOError("failed")

    # Save upload raises IOError
    mock_save_upload.side_effect = raiser

    test_contents = contents.Contents(
        protocol_file=contents.FileMeta(path=Path("abc.py"), content_hash="1111"),
        support_files=[],
        directory=mock_tempdir,
    )
    with pytest.raises(errors.ProtocolIOException, match="failed"):
        contents.update(
            contents=test_contents, upload_file=UploadFile(filename="abc.py")
        )


@patch.object(contents, "save_upload")
def test_update_replace_protocol(mock_save_upload, mock_tempdir):
    """That updating the protocol file updates protocol_file member."""
    test_contents = contents.Contents(
        protocol_file=contents.FileMeta(path=Path("abc.py"), content_hash="1111"),
        support_files=[],
        directory=mock_tempdir,
    )
    mock_save_upload.return_value = contents.FileMeta(
        path=Path("abc.py"), content_hash="222"
    )

    r = contents.update(
        contents=test_contents, upload_file=UploadFile(filename="abc.py")
    )

    assert r == contents.Contents(
        protocol_file=contents.FileMeta(path=Path("abc.py"), content_hash="222"),
        support_files=[],
        directory=mock_tempdir,
    )


@patch.object(contents, "save_upload")
def test_update_replace_support_file(mock_save_upload, mock_tempdir):
    """That updating a support file updates support_files member."""
    test_contents = contents.Contents(
        protocol_file=contents.FileMeta(path=Path("abc.py"), content_hash="1111"),
        support_files=[contents.FileMeta(path=Path("cba.py"), content_hash="2222")],
        directory=mock_tempdir,
    )
    mock_save_upload.return_value = contents.FileMeta(
        path=Path("cba.py"), content_hash="3333"
    )

    r = contents.update(
        contents=test_contents, upload_file=UploadFile(filename="cba.py")
    )

    assert r == contents.Contents(
        protocol_file=contents.FileMeta(path=Path("abc.py"), content_hash="1111"),
        support_files=[contents.FileMeta(path=Path("cba.py"), content_hash="3333")],
        directory=mock_tempdir,
    )


@patch.object(contents, "save_upload")
def test_update_adds_support_file(mock_save_upload, mock_tempdir):
    """That adding a support file updates support_files member."""
    test_contents = contents.Contents(
        protocol_file=contents.FileMeta(path=Path("abc.py"), content_hash="1111"),
        support_files=[],
        directory=mock_tempdir,
    )
    mock_save_upload.return_value = contents.FileMeta(
        path=Path("cba.py"), content_hash="3333"
    )

    r = contents.update(
        contents=test_contents, upload_file=UploadFile(filename="cba.py")
    )

    assert r == contents.Contents(
        protocol_file=contents.FileMeta(path=Path("abc.py"), content_hash="1111"),
        support_files=[contents.FileMeta(path=Path("cba.py"), content_hash="3333")],
        directory=mock_tempdir,
    )


@pytest.fixture(scope="module")
def contents_fixture() -> contents.Contents:
    return contents.create(
        protocol_file=UploadFile(filename="test_contents.py"),
        support_files=[UploadFile(filename="test_environment.py")],
    )


def test_directory_creation(contents_fixture):
    """Test that directory exists."""
    file_names = set(f.name for f in Path(contents_fixture.directory.name).iterdir())
    assert len(file_names) == 2
    assert "test_contents.py" in file_names
    assert "test_environment.py" in file_names


def test_update(contents_fixture):
    contents.update(contents_fixture, UploadFile(filename="test_contents2.py"))
    file_names = set(f.name for f in Path(contents_fixture.directory.name).iterdir())
    assert len(file_names) == 3
    assert "test_contents2.py" in file_names


def test_cleanup(contents_fixture):
    contents.clean_up(contents_fixture)
    assert Path(contents_fixture.directory.name).exists() is False
