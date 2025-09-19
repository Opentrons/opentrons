"""Tests for DataFileAutoDeleter."""
import logging

import pytest
from decoy import Decoy

from robot_server.data_files.data_files_store import DataFilesStore
from robot_server.data_files.file_auto_deleter import DataFileAutoDeleter
from robot_server.data_files.models import DataFileSource
from robot_server.deletion_planner import DataFileDeletionPlanner, FileUsageInfo


async def test_make_room_for_new_file(
    decoy: Decoy,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """It should get a deletion plan and enact it on the data files store."""
    mock_data_files_store = decoy.mock(cls=DataFilesStore)
    mock_deletion_planner = decoy.mock(cls=DataFileDeletionPlanner)

    files_usage = [
        FileUsageInfo(file_id="file-1", used_by_run_or_analysis=False),
        FileUsageInfo(file_id="file-2", used_by_run_or_analysis=True),
        FileUsageInfo(file_id="file-2", used_by_run_or_analysis=True),
    ]
    decoy.when(mock_deletion_planner.maximum_allowed_files).then_return(1)
    decoy.when(
        mock_data_files_store.get_usage_info(DataFileSource.UPLOADED)
    ).then_return(files_usage)
    decoy.when(mock_deletion_planner.plan_for_new_file(files_usage)).then_return(
        {"id-to-be-deleted-1", "id-to-be-deleted-2"}
    )
    subject = DataFileAutoDeleter(
        data_files_store=mock_data_files_store,
        deletion_planner=mock_deletion_planner,
    )
    with caplog.at_level(logging.INFO):
        await subject.make_room_for_new_file()

    decoy.verify(mock_data_files_store.remove("id-to-be-deleted-1"))
    decoy.verify(mock_data_files_store.remove("id-to-be-deleted-2"))
    assert "id-to-be-deleted-1" in caplog.text
    assert "id-to-be-deleted-2" in caplog.text
