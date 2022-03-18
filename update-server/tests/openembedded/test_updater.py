"""Tests for OE Updater."""
from unittest.mock import MagicMock

from otupdate.openembedded.updater import Updater


def test_update(mock_root_fs_interface: MagicMock, mock_partition_manager: MagicMock):
    """Test Updater class member function update()."""

    updater = Updater(
        root_FS_intf=mock_root_fs_interface, part_mngr=mock_partition_manager
    )
    updater.update()
    mock_partition_manager.find_unused_partition.assert_called()
    mock_root_fs_interface.write_update.assert_called()

