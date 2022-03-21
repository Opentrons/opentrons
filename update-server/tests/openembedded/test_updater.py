"""Tests for OE Updater."""
from unittest.mock import MagicMock

from otupdate.openembedded.updater import Updater


def test_update(mock_root_fs_interface: MagicMock, mock_partition_manager: MagicMock):
    """Test Updater class member function update()."""

    updater = Updater(
        root_FS_intf=mock_root_fs_interface, part_mngr=mock_partition_manager
    )

    def fake_callable(fake_val: float):
        """Fake callable."""
        pass

    updater.write_update("/mmc/blk0p1", fake_callable(24), 24, 1024)
    mock_partition_manager.find_unused_partition.assert_called()
    mock_root_fs_interface.write_file.assert_called()
