"""Tests for OE Updater."""
from unittest.mock import MagicMock

from otupdate.openembedded.updater import Updater
from otupdate.common.update_actions import Partition


def test_update(mock_root_fs_interface: MagicMock, mock_partition_manager: MagicMock):
    """Test Updater class member function decomp_and_write()."""

    updater = Updater(
        root_FS_intf=mock_root_fs_interface, part_mngr=mock_partition_manager
    )

    def fake_callable(fake_val: float):
        """Fake callable."""
        pass

    mock_partition_manager.find_unused_partition.return_value = Partition(
        2, "/dev/mmcblk0p2"
    )
    mock_partition_manager.switch_partition.return_value = Partition(
        2, "/dev/mmcblk0p2"
    )

    mock_partition_manager.mountpoint_root.return_value = "/mnt"

    updater.decomp_and_write("/mmc/blk0p1", fake_callable(24))
    mock_partition_manager.find_unused_partition.assert_called()
    mock_root_fs_interface.write_update.assert_called()

    updater.commit_update()
    mock_partition_manager.find_unused_partition.assert_called()
    mock_partition_manager.switch_partition.assert_called()

    updater.write_update("/mmc/blk0p1", fake_callable(24))
    mock_partition_manager.find_unused_partition.assert_called()

    updater.mount_update()
    mock_partition_manager.find_unused_partition.assert_called()
