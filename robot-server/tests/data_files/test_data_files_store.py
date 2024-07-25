"""Tests for the DataFilesStore interface."""
import pytest
from datetime import datetime, timezone
from sqlalchemy.engine import Engine as SQLEngine

from robot_server.data_files.data_files_store import DataFilesStore, DataFileInfo
from robot_server.data_files.models import FileIdNotFoundError


@pytest.fixture
def subject(sql_engine: SQLEngine) -> DataFilesStore:
    """Get a DataFilesStore test subject."""
    return DataFilesStore(sql_engine=sql_engine)


async def test_insert_data_file_info_and_fetch_by_hash(
    subject: DataFilesStore,
) -> None:
    """It should add the data file info to database."""
    data_file_info = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc123",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
    )
    assert subject.get_file_info_by_hash("abc123") is None
    await subject.insert(data_file_info)
    assert subject.get_file_info_by_hash("abc123") == data_file_info


async def test_insert_file_info_with_existing_id(
    subject: DataFilesStore,
) -> None:
    """It should raise an error when trying to add the same file ID to database."""
    data_file_info1 = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc123",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
    )
    data_file_info2 = DataFileInfo(
        id="file-id",
        name="file-name2",
        file_hash="abc1234",
        created_at=datetime(year=2024, month=6, day=20, tzinfo=timezone.utc),
    )
    await subject.insert(data_file_info1)
    with pytest.raises(Exception):
        await subject.insert(data_file_info2)


async def test_insert_data_file_info_and_get_by_id(
    subject: DataFilesStore,
) -> None:
    """It should get the inserted data file info from the database."""
    data_file_info = DataFileInfo(
        id="file-id",
        name="file-name",
        file_hash="abc",
        created_at=datetime(year=2024, month=7, day=15, tzinfo=timezone.utc),
    )
    await subject.insert(data_file_info)
    assert subject.get("file-id") == data_file_info


def test_get_by_id_raises(
    subject: DataFilesStore,
) -> None:
    """It should raise if the requested data file id does not exist."""
    with pytest.raises(FileIdNotFoundError):
        assert subject.get("file-id")
