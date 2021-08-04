""" tests for otupdate.openembedded.RootFS

Checks functionaly and error casees for the bmap operations on RootFS
"""
"""
import os
import subprocess
from unittest import mock
from otupdate.openembedded import root_fs as RootFS
"""
"""
def test_disk_image_write(tmp_path):
    d = tmp_path / "disk_image"
    d.mkdir()
    CONTENT = "mock_fs"
    p = d / "mockFS.wic"
    bmap = d / 'image.bmap'
    p.write_text(CONTENT)
    subprocess.run(["bmaptool", "create", "-o",
                    bmap, p])
    rfs = RootFS.RootFS()
    RootFS.SD_CARD_MOUNT_POINT = os.getcwd()
    RootFS.BMAP_FILE = bmap
    RootFS.DISK = d
    RootFS.BMAP_IMAGE = p
    rfs.factory_restore(None)
    assert sum([len(files) for r, d, files in os.walk(d)]) == 2
"""
"""
def test_swap_partition():
    rfs = RootFS.RootFS()
    rfs.get_partition = mock.MagicMock()
    rfs.set_partition = mock.MagicMock()
    rfs.swap_partition(None)
    assert rfs.get_partition.called
"""
"""
def test_debug():
    rfs = RootFS.RootFS()
    rfs.print_rootFS_config = mock.MagicMock()
    rfs.print_rootFS_partition = mock.MagicMock()
    rfs.debug(None)
    assert rfs.print_rootFS_config.called
    assert rfs.print_rootFS_partition.called
"""
