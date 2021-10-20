# -*- coding: utf-8 -*-
# vim: ts=4 sw=4 et ai si
#
# Copyright (c) 2012-2014 Intel, Inc.
# License: GPLv2
# Author: Artem Bityutskiy <artem.bityutskiy@linux.intel.com>
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License, version 2,
# as published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# General Public License for more details.

"""
This test verifies 'BmapHelpers' module functionality.
"""

import os
import sys
import tempfile
from mock import patch, mock
from backports import tempfile as btempfile
from bmaptools import BmapHelpers


# This is a work-around for Centos 6
try:
    import unittest2 as unittest  # pylint: disable=F0401
except ImportError:
    import unittest


class TestBmapHelpers(unittest.TestCase):
    """The test class for these unit tests."""

    def test_get_file_system_type(self):
        """Check a file system type is returned when used with a file"""

        with tempfile.NamedTemporaryFile("r", prefix="testfile_",
                                         delete=True, dir=".", suffix=".img") as fobj:
            fstype = BmapHelpers.get_file_system_type(fobj.name)
            self.assertTrue(fstype)

    def test_get_file_system_type_no_fstype_found(self):
        """Check error raised when supplied file doesnt exist"""

        directory = os.path.dirname(__file__)
        fobj = os.path.join(directory, "BmapHelpers/file/does/not/exist")
        with self.assertRaises(BmapHelpers.Error):
            BmapHelpers.get_file_system_type(fobj)

    def test_get_file_system_type_symlink(self):
        """Check a file system type is returned when used with a symlink"""

        with btempfile.TemporaryDirectory(prefix="testdir_", dir=".") as directory:
            fobj = tempfile.NamedTemporaryFile("r", prefix="testfile_", delete=False,
                                            dir=directory, suffix=".img")
            lnk = os.path.join(directory, "test_symlink")
            os.symlink(fobj.name, lnk)
            fstype = BmapHelpers.get_file_system_type(lnk)
            self.assertTrue(fstype)

    def test_is_zfs_configuration_compatible_enabled(self):
        """Check compatiblilty check is true when zfs param is set correctly"""

        with tempfile.NamedTemporaryFile("w+", prefix="testfile_",
                                         delete=True, dir=".", suffix=".txt") as fobj:
            fobj.write("1")
            fobj.flush()
            mockobj = mock.patch.object(BmapHelpers, "ZFS_COMPAT_PARAM_PATH", fobj.name)
            with mockobj:
                self.assertTrue(BmapHelpers.is_zfs_configuration_compatible())


    def test_is_zfs_configuration_compatible_disabled(self):
        """Check compatiblilty check is false when zfs param is set incorrectly"""

        with tempfile.NamedTemporaryFile("w+", prefix="testfile_",
                                         delete=True, dir=".", suffix=".txt") as fobj:
            fobj.write("0")
            fobj.flush()
            mockobj = mock.patch.object(BmapHelpers, "ZFS_COMPAT_PARAM_PATH", fobj.name)
            with mockobj:
                self.assertFalse(BmapHelpers.is_zfs_configuration_compatible())

    def test_is_zfs_configuration_compatible_invalid_read_value(self):
        """Check error raised if any content of zfs config file invalid"""

        with tempfile.NamedTemporaryFile("a", prefix="testfile_",
                                         delete=True, dir=".", suffix=".txt") as fobj:
            mockobj = mock.patch.object(BmapHelpers, "ZFS_COMPAT_PARAM_PATH", fobj.name)
            with self.assertRaises(BmapHelpers.Error):
                with mockobj:
                    BmapHelpers.is_zfs_configuration_compatible()

    @patch("builtins.open" if sys.version_info[0] >= 3 else "__builtin__.open")
    def test_is_zfs_configuration_compatible_unreadable_file(self, mock_open):
        """Check error raised if any IO errors when checking zfs config file"""

        mock_open.side_effect = IOError
        with self.assertRaises(BmapHelpers.Error):
            BmapHelpers.is_zfs_configuration_compatible()

    def test_is_zfs_configuration_compatible_notinstalled(self):
        """Check compatiblilty check passes when zfs not installed"""

        directory = os.path.dirname(__file__)
        filepath = os.path.join(directory, "BmapHelpers/file/does/not/exist")
        mockobj = mock.patch.object(BmapHelpers, "ZFS_COMPAT_PARAM_PATH", filepath)
        with mockobj:
            self.assertFalse(BmapHelpers.is_zfs_configuration_compatible())

    @patch.object(BmapHelpers, "get_file_system_type", return_value="zfs")
    def test_is_compatible_file_system_zfs_valid(self, mock_get_fs_type): #pylint: disable=unused-argument
        """Check compatiblilty check passes when zfs param is set correctly"""

        with tempfile.NamedTemporaryFile("w+", prefix="testfile_",
                                         delete=True, dir=".", suffix=".img") as fobj:
            fobj.write("1")
            fobj.flush()
            mockobj = mock.patch.object(BmapHelpers, "ZFS_COMPAT_PARAM_PATH", fobj.name)
            with mockobj:
                self.assertTrue(BmapHelpers.is_compatible_file_system(fobj.name))

    @patch.object(BmapHelpers, "get_file_system_type", return_value="zfs")
    def test_is_compatible_file_system_zfs_invalid(self, mock_get_fs_type): #pylint: disable=unused-argument
        """Check compatiblilty check fails when zfs param is set incorrectly"""

        with tempfile.NamedTemporaryFile("w+", prefix="testfile_",
                                         delete=True, dir=".", suffix=".img") as fobj:
            fobj.write("0")
            fobj.flush()
            mockobj = mock.patch.object(BmapHelpers, "ZFS_COMPAT_PARAM_PATH", fobj.name)
            with mockobj:
                self.assertFalse(BmapHelpers.is_compatible_file_system(fobj.name))

    @patch.object(BmapHelpers, "get_file_system_type", return_value="ext4")
    def test_is_compatible_file_system_ext4(self, mock_get_fs_type): #pylint: disable=unused-argument
        """Check non-zfs file systems pass compatiblilty checks"""

        with tempfile.NamedTemporaryFile("w+", prefix="testfile_",
                                         delete=True, dir=".", suffix=".img") as fobj:
            self.assertTrue(BmapHelpers.is_compatible_file_system(fobj.name))
