"""Test the file provider."""

from datetime import datetime
from pathlib import Path
from unittest.mock import Mock

import pytest

from opentrons.protocol_engine.resources.file_provider import (
    FileData,
    UserDefinedCSVCmdFileNameMetadata,
)
from opentrons_shared_data.data_files import (
    MimeType,
    RunFileNameMetadata,
)

from robot_server.data_files.data_files_store import DataFilesStore
from robot_server.disk_monitor.monitor import DiskMonitor
from robot_server.file_provider.provider import FileProviderExecutor
from robot_server.service.notifications.publishers import DataFilePublisher
from robot_server.settings import RobotServerSettings


@pytest.fixture
def images_directory(tmp_path: Path) -> Path:
    """Temporary images directory."""
    images_dir = tmp_path / "images"
    images_dir.mkdir()
    return images_dir


@pytest.fixture
def data_directory(tmp_path: Path) -> Path:
    """Temporary data directory."""
    images_dir = tmp_path / "data"
    images_dir.mkdir()
    return images_dir


@pytest.fixture
def mock_df_store() -> DataFilesStore:
    """Mock file store."""
    store = Mock(spec=DataFilesStore)
    return store


@pytest.fixture
def mock_df_publisher() -> DataFilePublisher:
    """Mock for testing."""
    publisher = Mock(spec=DataFilePublisher)
    return publisher


@pytest.fixture
def mock_settings() -> RobotServerSettings:
    """Mock settings with test values."""
    settings = Mock(spec=RobotServerSettings)
    settings.system_low_space_threshold_mb = 1000.0
    settings.images_directory_max_size_mb = 500.0
    return settings


@pytest.fixture
def mock_monitor(
    images_directory: Path, mock_settings: RobotServerSettings
) -> DiskMonitor:
    """Instance for testing."""
    return DiskMonitor(
        images_directory=images_directory,
        settings=mock_settings,
    )


@pytest.fixture
def subject(
    images_directory: Path,
    data_directory: Path,
    mock_df_store: DataFilesStore,
    mock_monitor: DiskMonitor,
    mock_settings: RobotServerSettings,
    mock_df_publisher: DataFilePublisher,
) -> FileProviderExecutor:
    """Test instance for file provider."""
    return FileProviderExecutor(
        images_directory,
        data_directory,
        mock_df_store,
        mock_monitor,
        mock_settings,
        mock_df_publisher,
    )


async def test_write_new_file(subject: FileProviderExecutor) -> None:
    """Just make sure nothing goes wrong."""
    run_metadata = RunFileNameMetadata(
        robot_name="robot",
        run_id="4567",
        run_created_at=datetime.now(),
        protocol_name=None,
    )
    cmd_metadata = UserDefinedCSVCmdFileNameMetadata(
        filename="file", command_id="123", prev_command_id="122", file_id=None
    )
    file_data = FileData.build(
        data=bytes(b"1,2,3,4,5,"),
        mime_type=MimeType.TEXT_CSV,
        run_metadata=run_metadata,
        command_metadata=cmd_metadata,
    )
    file_info = await subject.write_file_cb(file_data)

    # make sure it appends a csv to the filename if there's not one
    assert file_info.path.endswith("file.csv")

    cmd_metadata = UserDefinedCSVCmdFileNameMetadata(
        filename="file.csv", command_id="123", prev_command_id="122", file_id=None
    )
    file_data = FileData.build(
        data=bytes(b"1,2,3,4,5,"),
        mime_type=MimeType.TEXT_CSV,
        run_metadata=run_metadata,
        command_metadata=cmd_metadata,
    )
    # make sure it didn't tack on a second .csv ending
    assert file_info.path.endswith("file.csv")


async def test_append(subject: FileProviderExecutor) -> None:
    """Just make sure nothing goes wrong."""
    run_metadata = RunFileNameMetadata(
        robot_name="robot",
        run_id="4567",
        run_created_at=datetime.now(),
        protocol_name=None,
    )
    cmd_metadata = UserDefinedCSVCmdFileNameMetadata(
        filename="file", command_id="123", prev_command_id="122", file_id=None
    )
    file_data = FileData.build(
        data=bytes(b"1,2,3,4,5,\n"),
        mime_type=MimeType.TEXT_CSV,
        run_metadata=run_metadata,
        command_metadata=cmd_metadata,
    )
    # Do the first write
    first_file_info = await subject.write_file_cb(file_data)

    subject._data_files_store.insert.assert_called_once_with(first_file_info)  # type: ignore[attr-defined]
    subject._data_files_store.insert.reset_mock()  # type: ignore[attr-defined]

    with open(first_file_info.path, "r") as output:
        first_call_lines = output.readlines()

    assert len(first_call_lines) == 1
    cmd_metadata = UserDefinedCSVCmdFileNameMetadata(
        filename="file",
        command_id="124",
        prev_command_id="123",
        file_id=first_file_info.id,
    )
    file_data = FileData.build(
        data=bytes(b"1,2,3,4,5,\n"),
        mime_type=MimeType.TEXT_CSV,
        run_metadata=run_metadata,
        command_metadata=cmd_metadata,
    )

    # Do a second write with the same data
    second_file_info = await subject.write_file_cb(file_data)

    # Should not be inserted a second time
    subject._data_files_store.insert.assert_not_called()  # type: ignore[attr-defined]

    # All of this should be the same
    assert first_file_info.id == second_file_info.id
    assert first_file_info.name == second_file_info.name
    assert first_file_info.path == second_file_info.path
    with open(first_file_info.path, "r") as output:
        second_call_lines = output.readlines()
    assert len(second_call_lines) == 2
