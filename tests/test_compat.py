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
This unit test verifies various compatibility aspects of the BmapCopy module:
    * current BmapCopy has to handle all the older bmap formats
    * older BmapCopy have to handle all the newer compatible bmap formats
"""

# Disable the following pylint recommendations:
#   *  Too many public methods (R0904)
#   *  Attribute 'XYZ' defined outside __init__ (W0201), because unittest
#      classes are not supposed to have '__init__()'
# pylint: disable=R0904
# pylint: disable=W0201

import os
import shutil
import tempfile
from tests import helpers
from bmaptools import TransRead, BmapCopy

# This is a work-around for Centos 6
try:
    import unittest2 as unittest  # pylint: disable=F0401
except ImportError:
    import unittest

# Test image file name
_IMAGE_NAME = "test.image.gz"
# Test bmap file names template
_BMAP_TEMPL = "test.image.bmap.v"
# Name of the subdirectory where test data are stored
_TEST_DATA_SUBDIR = "test-data"
# Name of the subdirectory where old BmapCopy modules are stored
_OLDCODEBASE_SUBDIR = "oldcodebase"


class TestCompat(unittest.TestCase):
    """The test class for this unit test."""

    def test(self):
        """The test entry point."""

        test_data_dir = os.path.join(os.path.dirname(__file__),
                                     _TEST_DATA_SUBDIR)
        image_path = os.path.join(test_data_dir, _IMAGE_NAME)

        # Construct the list of bmap files to test
        self._bmap_paths = []
        for dentry in os.listdir(test_data_dir):
            dentry_path = os.path.join(test_data_dir, dentry)
            if os.path.isfile(dentry_path) and dentry.startswith(_BMAP_TEMPL):
                self._bmap_paths.append(dentry_path)

        # Create and open a temporary file for uncompressed image and its copy
        self._f_image = tempfile.NamedTemporaryFile("wb+", prefix=_IMAGE_NAME,
                                                    suffix=".image")
        self._f_copy = tempfile.NamedTemporaryFile("wb+", prefix=_IMAGE_NAME,
                                                   suffix=".copy")

        # Uncompress the test image into 'self._f_image'
        f_tmp_img = TransRead.TransRead(image_path)
        shutil.copyfileobj(f_tmp_img, self._f_image)
        f_tmp_img.close()
        self._f_image.flush()

        image_chksum = helpers.calculate_chksum(self._f_image.name)
        image_size = os.path.getsize(self._f_image.name)

        # Test the current version of BmapCopy
        for bmap_path in self._bmap_paths:
            helpers.copy_and_verify_image(image_path, self._f_copy.name,
                                          bmap_path, image_chksum,
                                          image_size)

        # Test the older versions of BmapCopy
        self._test_older_bmapcopy()

        self._f_copy.close()
        self._f_image.close()

    def _test_older_bmapcopy(self):
        """Test older than the current versions of the BmapCopy class."""

        def import_module(searched_module):
            """Search and import a module by its name."""

            modref = __import__(searched_module)
            for name in searched_module.split(".")[1:]:
                modref = getattr(modref, name)
            return modref

        oldcodebase_dir = os.path.join(os.path.dirname(__file__),
                                       _OLDCODEBASE_SUBDIR)

        # Construct the list of old BmapCopy modules
        old_modules = []
        for dentry in os.listdir(oldcodebase_dir):
            if dentry.startswith("BmapCopy") and dentry.endswith(".py"):
                old_modules.append("tests." + _OLDCODEBASE_SUBDIR + "." + dentry[:-3])

        for old_module in old_modules:
            modref = import_module(old_module)

            for bmap_path in self._bmap_paths:
                self._do_test_older_bmapcopy(bmap_path, modref)

    def _do_test_older_bmapcopy(self, bmap_path, modref):
        """
        Test an older version of BmapCopy class, referenced to by the 'modref'
        argument. The 'bmap_path' argument is the bmap file path to test with.
        """

        # Get a reference to the older BmapCopy class object to test with
        old_bmapcopy_class = getattr(modref, "BmapCopy")
        supported_ver = getattr(modref, "SUPPORTED_BMAP_VERSION")

        f_bmap = open(bmap_path, "r")

        # Find the version of the bmap file. The easiest is to simply use the
        # latest BmapCopy.
        bmapcopy = BmapCopy.BmapCopy(self._f_image, self._f_copy, f_bmap)
        bmap_version = bmapcopy.bmap_version
        bmap_version_major = bmapcopy.bmap_version_major

        try:
            if supported_ver >= bmap_version:
                writer = old_bmapcopy_class(self._f_image, self._f_copy, f_bmap)
                writer.copy(True, True)
        except:  # pylint: disable=W0702
            if supported_ver >= bmap_version_major:
                # The BmapCopy which we are testing is supposed to support this
                # version of bmap file format. However, bmap format version 1.4
                # was a screw-up, because it actually had incompatible changes,
                # so old versions of BmapCopy are supposed to fail.
                if not (supported_ver == 1 and bmap_version == "1.4"):
                    print("Module \"%s\" failed to handle \"%s\"" %
                          (modref.__name__, bmap_path))
                    raise

        f_bmap.close()
