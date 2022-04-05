from unittest.mock import MagicMock
import pytest

from otupdate.common.update_actions import Partition
from otupdate.openembedded.updater import RootFSInterface, PartitionManager


@pytest.fixture
def mock_root_fs_interface() -> MagicMock:
    """Mock RootFSInterface."""
    return MagicMock(spec=RootFSInterface)


@pytest.fixture
def mock_partition_manager_valid_switch() -> MagicMock:
    """Mock Partition Manager."""
    mock = MagicMock(spec=PartitionManager)
    mock.find_unused_partition.return_value = Partition(2, "/dev/mmcblk0p2")
    mock.switch_partition.return_value = Partition(2, "/dev/mmcblk0p2")

    mock.mountpoint_root.return_value = "/mnt"

    return mock


@pytest.fixture
def mock_partition_manager_invalid_switch() -> MagicMock:
    """Mock Partition Manager."""
    mock = MagicMock(spec=PartitionManager)
    mock.find_unused_partition.return_value = Partition(2, "/dev/mmcblk0p2")
    mock.switch_partition.return_value = Partition(3, "/dev/mmcblk0p2")

    mock.mountpoint_root.return_value = "/mnt"

    return mock
