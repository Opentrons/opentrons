import collections
import os
from unittest import mock
from unittest.mock import MagicMock
import pytest
from aiohttp.test_utils import TestClient

from otupdate import openembedded
from otupdate.common.update_actions import Partition, UpdateActionsInterface
from otupdate.openembedded.updater import RootFSInterface, PartitionManager, Updater

HERE = os.path.abspath(os.path.dirname(__file__))


@pytest.fixture
def mock_update_actions_interface(
    mock_root_fs_interface: MagicMock, mock_partition_manager_invalid_switch: MagicMock
) -> MagicMock:
    """Mock UpdateActionsInterface"""
    updater = Updater(
        root_FS_intf=mock_root_fs_interface,
        part_mngr=mock_partition_manager_invalid_switch,
    )
    mock = MagicMock(spec=UpdateActionsInterface)
    mock.from_request.return_value = updater


@pytest.fixture
async def test_cli(
    aiohttp_client, otupdate_config, version_file_path, mock_name_synchronizer
) -> TestClient:
    """
    Build an app using dummy versions, then build a test client and return it
    """
    app = openembedded.get_app(
        name_synchronizer=mock_name_synchronizer,
        system_version_file=version_file_path,
        config_file_override=otupdate_config,
        boot_id_override="dummy-boot-id-abc123",
    )
    client = await aiohttp_client(app)
    return client


@pytest.fixture
def mock_root_fs_interface() -> MagicMock:
    """Mock RootFSInterface."""
    return MagicMock(spec=RootFSInterface)


def mock_partition_manager_valid_switch_() -> MagicMock:
    """Mock Partition Manager."""
    mock = MagicMock(spec=PartitionManager)
    mock.find_unused_partition.return_value = Partition(
        2, "/dev/mmcblk0p2", "/media/mmcblk0p2"
    )
    mock.switch_partition.return_value = Partition(
        2, "/dev/mmcblk0p2", "/media/mmcblk0p2"
    )
    mock.resize_partition.return_value = True
    mock.mount_fs.return_value = True
    mock.umount_fs.return_value = True

    mock.mountpoint_root.return_value = "/mnt"

    return mock


FakeRootPartElem = collections.namedtuple("FakeRootPartElem", ("name", "value"))


@pytest.fixture
def mock_partition_manager_valid_switch(tmpdir) -> MagicMock:
    """Mock Partition Manager."""
    partfile = os.path.join(tmpdir, "fake-partition")
    mock_part = MagicMock(spec=PartitionManager)
    mock_part.find_unused_partition.return_value = Partition(2, partfile)
    mock_part.switch_partition.return_value = Partition(2, partfile)
    mock_part.resize_partition.return_value = True
    mock_part.mount_fs.return_value = True
    mock_part.umount_fs.return_value = True

    mock_part.mountpoint_root.return_value = "/mnt"

    return mock_part


@pytest.fixture
def mock_partition_manager_invalid_switch() -> MagicMock:
    """Mock Partition Manager."""
    mock = MagicMock(spec=PartitionManager)
    mock.find_unused_partition.return_value = Partition(
        2, "/dev/mmcblk0p2", "/media/mmcblk0p2"
    )
    mock.switch_partition.return_value = Partition(
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
        "TWO", Partition(2, part_file, "/mnt/mmblk0-p2")
    )
    return part_file
