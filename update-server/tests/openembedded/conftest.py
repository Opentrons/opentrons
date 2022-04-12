import os
from unittest import mock
from unittest.mock import MagicMock
import pytest

from otupdate import openembedded
from otupdate.common.update_actions import Partition
from otupdate.openembedded.updater import RootFSInterface, PartitionManager
from tests.common.config import FakeRootPartElem


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


@pytest.fixture
def testing_partition(monkeypatch, tmpdir):
    part_file = os.path.join(tmpdir, "fake-partition")
    find_unused = mock.Mock()
    monkeypatch.setattr(
        openembedded.updater.PartitionManager, "find_unused_partition", find_unused
    )
    find_unused.return_value = FakeRootPartElem("TWO", Partition(2, part_file))
    return part_file
