"""Tests for OE Updater."""
import os
from unittest import mock
from unittest.mock import MagicMock

import pytest

from otupdate.common.update_actions import Partition
from otupdate.openembedded.update_actions import (
    OT3UpdateActions,
    PartitionManager,
    RootFSInterface,
)

import lzma


# test valid partition switch


def test_update_valid_part_switch(
    mock_root_fs_interface: MagicMock, mock_partition_manager_valid_switch: MagicMock
):
    """Test root fs being written to unused partition."""

    updater = OT3UpdateActions(
        root_FS_intf=mock_root_fs_interface,
        part_mngr=mock_partition_manager_valid_switch,
    )
    # lambda just mocks progress callback,
    # 2 here has no significance whatsoever.
    updater.decomp_and_write("/mmc/blk0p1", lambda x: x(2))
    mock_partition_manager_valid_switch.find_unused_partition.assert_called()
    mock_root_fs_interface.write_update.assert_called()
    updater.commit_update()
    mock_partition_manager_valid_switch.find_unused_partition.assert_called()
    mock_partition_manager_valid_switch.switch_partition.assert_called()

    updater.write_update("/mmc/blk0p1", lambda x: x(2))
    mock_partition_manager_valid_switch.find_unused_partition.assert_called()

    updater.mount_update()
    mock_partition_manager_valid_switch.find_unused_partition.assert_called()


def test_update_invalid_part_switch(
    mock_root_fs_interface: MagicMock, mock_partition_manager_invalid_switch: MagicMock
):
    """Test for an invalid partition switch."""

    updater = OT3UpdateActions(
        root_FS_intf=mock_root_fs_interface,
        part_mngr=mock_partition_manager_invalid_switch,
    )

    updater.decomp_and_write("/mmc/blk0p1", lambda x: x(2))
    mock_partition_manager_invalid_switch.find_unused_partition.assert_called()
    mock_root_fs_interface.write_update.assert_called()

    with pytest.raises(RuntimeError):
        updater.commit_update()
    mock_partition_manager_invalid_switch.find_unused_partition.assert_called()


@pytest.mark.parametrize(
    "test_input,expected",
    [
        (b"2", Partition(3, "/dev/mmcblk0p3", "/media/mmcblk0p3")),
        (b"3", Partition(2, "/dev/mmcblk0p2", "/media/mmcblk0p2")),
        (b"", Partition(3, "/dev/mmcblk0p3", "/media/mmcblk0p3")),
    ],
)
def test_unused_partition(mock_root_fs_interface, test_input, expected):
    pm = PartitionManager()
    updater = OT3UpdateActions(root_FS_intf=mock_root_fs_interface, part_mngr=pm)
    assert updater.part_mngr.find_unused_partition(test_input) == expected


def test_decomp_and_write(
    mock_root_fs_interface: MagicMock, mock_partition_manager_valid_switch: MagicMock
):
    """Test helper functions get called as expected in decomp_and_write"""
    updater = OT3UpdateActions(
        root_FS_intf=mock_root_fs_interface,
        part_mngr=mock_partition_manager_valid_switch,
    )

    updater.decomp_and_write("test_path", lambda x: x(2))
    mock_partition_manager_valid_switch.find_unused_partition.assert_called()
    mock_root_fs_interface.write_update.assert_called()


def test_commit_update(
    mock_root_fs_interface: MagicMock,
    mock_partition_manager_valid_switch: MagicMock,
):
    """Test commit_update mounts and resizes rootfs as expected!"""
    updater = OT3UpdateActions(
        root_FS_intf=mock_root_fs_interface,
        part_mngr=mock_partition_manager_valid_switch,
    )
    updater.commit_update()
    mock_partition_manager_valid_switch.mount_fs.assert_called()
    mock_partition_manager_valid_switch.resize_partition.assert_called()


def test_lzma(testing_partition, tmpdir):
    """Test that lzma decompresses a .xz correctly.

    Updater::write_update has a callback to report progress. callback gets kicked
    off on writing every chunk.

    This test uses callback call count to see if
    the entire file decompresses correctly.
    """
    rfs_path = os.path.join(tmpdir, "rootfs.xz")
    with lzma.open(rfs_path, "w") as f:
        f.write(os.urandom(400000))
    cb = mock.Mock()
    root_FS_intf = RootFSInterface()
    p = Partition(2, testing_partition, "/media/mmcblk0p2")
    total_size = 0
    chunk_size = 1024 * 32
    with lzma.open(rfs_path, "rb") as fsrc:
        while True:
            chunk = fsrc.read(chunk_size)
            total_size += len(chunk)
            if len(chunk) != chunk_size:
                break
    root_FS_intf.write_update(rfs_path, p, cb, chunk_size)
    if total_size % chunk_size != 0:
        calls = int(total_size / chunk_size) + 1
    else:
        calls = total_size / chunk_size
    assert cb.call_count == calls
