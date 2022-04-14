import os
from unittest import mock
from unittest.mock import MagicMock
import pytest

from otupdate import openembedded
from otupdate.openembedded.updater import RootFSInterface, PartitionManager
from tests.common.config import FakeRootPartElem
from otupdate.openembedded.constants import OEPartition


@pytest.fixture
def mock_root_fs_interface() -> MagicMock:
    """Mock RootFSInterface."""
    return MagicMock(spec=RootFSInterface)


@pytest.fixture
def mock_partition_manager_valid_switch() -> MagicMock:
    """Mock Partition Manager."""
    mock = MagicMock(spec=PartitionManager)
    mock.find_unused_partition.return_value = OEPartition(
        2, "/dev/mmcblk0p2", "/media/mmcblk0p2"
    )
    mock.switch_partition.return_value = OEPartition(
        2, "/dev/mmcblk0p2", "/media/mmcblk0p2"
    )
    mock.resize_partition.return_value = True
    mock.mount_fs.return_value = True
    mock.umount_fs.return_value = True

    mock.mountpoint_root.return_value = "/mnt"

    return mock


@pytest.fixture
def mock_partition_manager_invalid_switch() -> MagicMock:
    """Mock Partition Manager."""
    mock = MagicMock(spec=PartitionManager)
    mock.find_unused_partition.return_value = OEPartition(
        2, "/dev/mmcblk0p2", "/media/mmcblk0p2"
    )
    mock.switch_partition.return_value = OEPartition(
        3, "/dev/mmcblk0p3", "/media/mmcblk0p3"
    )
    mock.resize_partition.return_value = True

    mock.mountpoint_root.return_value = "/mnt"

    return mock


@pytest.fixture
def testing_partition(monkeypatch, tmpdir):
    part_file = os.path.join(tmpdir, "fake-partition")
    find_unused = mock.Mock()
    monkeypatch.setattr(
        openembedded.updater.PartitionManager, "find_unused_partition", find_unused
    )
    find_unused.return_value = FakeRootPartElem(
        "TWO", OEPartition(2, part_file, "/mnt/mmblk0-p2")
    )
    return part_file
