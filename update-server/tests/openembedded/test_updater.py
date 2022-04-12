"""Tests for OE Updater."""
from unittest import mock
from unittest.mock import MagicMock

import pytest

from otupdate.common.update_actions import Partition
from otupdate.openembedded.updater import Updater, PartitionManager, RootFSInterface


# test valid partition switch


def test_update_valid_part_switch(
    mock_root_fs_interface: MagicMock, mock_partition_manager_valid_switch: MagicMock
):
    """Test root fs being written to unused partition."""

    updater = Updater(
        root_FS_intf=mock_root_fs_interface,
        part_mngr=mock_partition_manager_valid_switch,
    )

    def fake_callable(fake_val: float):
        """Fake callable."""
        pass

    updater.decomp_and_write("/mmc/blk0p1", fake_callable(24))
    mock_partition_manager_valid_switch.find_unused_partition.assert_called()
    mock_root_fs_interface.write_update.assert_called()
    updater.commit_update()
    mock_partition_manager_valid_switch.find_unused_partition.assert_called()
    mock_partition_manager_valid_switch.switch_partition.assert_called()

    updater.write_update("/mmc/blk0p1", fake_callable(24))
    mock_partition_manager_valid_switch.find_unused_partition.assert_called()

    updater.mount_update()
    mock_partition_manager_valid_switch.find_unused_partition.assert_called()


# test invalid partition switch
# root fs not being written to unused partition


def test_update_invalid_part_switch(
    mock_root_fs_interface: MagicMock, mock_partition_manager_invalid_switch: MagicMock
):
    """Test for an invalid partition switch."""

    updater = Updater(
        root_FS_intf=mock_root_fs_interface,
        part_mngr=mock_partition_manager_invalid_switch,
    )

    def fake_callable(fake_val: float):
        """Fake callable."""
        pass

    updater.decomp_and_write("/mmc/blk0p1", fake_callable(24))
    mock_partition_manager_invalid_switch.find_unused_partition.assert_called()
    mock_root_fs_interface.write_update.assert_called()

    with pytest.raises(RuntimeError):
        updater.commit_update()
    mock_partition_manager_invalid_switch.find_unused_partition.assert_called()


@pytest.mark.parametrize(
    "test_input,expected",
    [
        (b"2", Partition(3, "/dev/mmcblk0p3")),
        (b"3", Partition(2, "/dev/mmcblk0p2")),
        (b"", Partition(3, "/dev/mmcblk0p3")),
    ],
)
def test_unused_partition(mock_root_fs_interface, test_input, expected):
    pm = PartitionManager()
    updater = Updater(root_FS_intf=mock_root_fs_interface, part_mngr=pm)
    assert updater.part_mngr.find_unused_partition(test_input) == expected


def test_decomp_and_write(
    mock_root_fs_interface: MagicMock, mock_partition_manager_valid_switch: MagicMock
):
    """Test helper functions get called as expected in decomp_and_write"""
    updater = Updater(
        root_FS_intf=mock_root_fs_interface,
        part_mngr=mock_partition_manager_valid_switch,
    )

    def fake_callable(fake_val: float):
        """Fake callable."""
        pass

    updater.decomp_and_write("test_path", fake_callable)
    mock_partition_manager_valid_switch.find_unused_partition.assert_called()
    mock_root_fs_interface.write_update.assert_called()


def test_lzma(testing_partition):
    cb = mock.Mock()
    root_FS_intf = RootFSInterface()
    p = Partition(2, testing_partition)
    root_FS_intf.write_update("rootfs.xz", p, cb)
    size_of_rootfs = 1436978176
    calls = size_of_rootfs / 1024
    if calls * 1024 != size_of_rootfs:
        calls += 1
    assert cb.call_count == calls
