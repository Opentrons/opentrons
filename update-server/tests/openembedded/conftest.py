from unittest.mock import MagicMock
import pytest

from otupdate.openembedded.updater import RootFSInterface, PartitionManager


@pytest.fixture
def mock_root_fs_interface() -> MagicMock:
    """Mock RootFSInterface."""
    return MagicMock(spec=RootFSInterface)


@pytest.fixture
def mock_partition_manager() -> MagicMock:
    """Mock Partition Manager."""
    return MagicMock(spec=PartitionManager)
