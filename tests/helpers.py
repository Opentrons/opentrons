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
This module contains independent functions shared between various
tests.
"""

# Disable the following pylint recommendations:
#   * Too many statements (R0915)
# pylint: disable=R0915

import tempfile
import random
import itertools
import hashlib
import struct
import sys
import os
from bmaptools import BmapHelpers, BmapCopy, TransRead


def _create_random_sparse_file(file_obj, size):
    """
    Create a sparse file with randomly distributed holes. The mapped areas are
    filled with semi-random data. Returns a tuple containing 2 lists:
      1. a list of mapped block ranges, same as 'Filemap.get_mapped_ranges()'
      2. a list of unmapped block ranges (holes), same as
         'Filemap.get_unmapped_ranges()'
    """

    file_obj.truncate(size)
    block_size = BmapHelpers.get_block_size(file_obj)
    blocks_cnt = (size + block_size - 1) // block_size

    def process_block(block):
        """
        This is a helper function which processes a block. It randomly decides
        whether the block should be filled with random data or should become a
        hole. Returns 'True' if the block was mapped and 'False' otherwise.
        """

        map_the_block = random.getrandbits(1)

        if map_the_block:
            # Randomly select how much we are going to write
            seek = random.randint(0, block_size - 1)
            write = random.randint(1, block_size - seek)
            assert seek + write <= block_size
            file_obj.seek(block * block_size + seek)
            file_obj.write(struct.pack("=B", random.getrandbits(8)) * write)
        return map_the_block

    mapped = []
    unmapped = []
    iterator = range(0, blocks_cnt)
    for was_mapped, group in itertools.groupby(iterator, process_block):
        # Start of a mapped region or a hole. Find the last element in the
        # group.
        first = next(group)
        last = first
        for last in group:
            pass

        if was_mapped:
            mapped.append((first, last))
        else:
            unmapped.append((first, last))

    file_obj.truncate(size)
    file_obj.flush()

    return (mapped, unmapped)


def _create_random_file(file_obj, size):
    """
    Fill the 'file_obj' file object with semi-random data up to the size 'size'.
    """

    chunk_size = 1024 * 1024
    written = 0

    while written < size:
        if written + chunk_size > size:
            chunk_size = size - written

        file_obj.write(struct.pack("=B", random.getrandbits(8)) * chunk_size)

        written += chunk_size

    file_obj.flush()


def generate_test_files(max_size=4 * 1024 * 1024, directory=None, delete=True):
    """
    This is a generator which yields files which other tests use as the input
    for the testing. The generator tries to yield "interesting" files which
    cover various corner-cases. For example, a large hole file, a file with
    no holes, files of unaligned length, etc.

    The 'directory' argument specifies the directory path where the yielded
    test files should be created. The 'delete' argument specifies whether the
    yielded test files have to be automatically deleted.

    The generator yields tuples consisting of the following elements:
      1. the test file object
      2. file size in bytes
      3. a list of mapped block ranges, same as 'Filemap.get_mapped_ranges()'
      4. a list of unmapped block ranges (holes), same as
         'Filemap.get_unmapped_ranges()'
    """

    #
    # Generate sparse files with one single hole spanning the entire file
    #

    # A block-sized hole
    file_obj = tempfile.NamedTemporaryFile("wb+", prefix="4Khole_",
                                           delete=delete, dir=directory,
                                           suffix=".img")
    block_size = BmapHelpers.get_block_size(file_obj)
    file_obj.truncate(block_size)
    yield (file_obj, block_size, [], [(0, 0)])
    file_obj.close()

    # A block size + 1 byte hole
    file_obj = tempfile.NamedTemporaryFile("wb+", prefix="4Khole_plus_1_",
                                           delete=delete, dir=directory,
                                           suffix=".img")
    file_obj.truncate(block_size + 1)
    yield (file_obj, block_size + 1, [], [(0, 1)])
    file_obj.close()

    # A block size - 1 byte hole
    file_obj = tempfile.NamedTemporaryFile("wb+", prefix="4Khole_minus_1_",
                                           delete=delete, dir=directory,
                                           suffix=".img")
    file_obj.truncate(block_size - 1)
    yield (file_obj, block_size - 1, [], [(0, 0)])
    file_obj.close()

    # A 1-byte hole
    file_obj = tempfile.NamedTemporaryFile("wb+", prefix="1byte_hole_",
                                           delete=delete, dir=directory,
                                           suffix=".img")
    file_obj.truncate(1)
    yield (file_obj, 1, [], [(0, 0)])
    file_obj.close()

    # And 10 holes of random size
    for i in range(10):
        size = random.randint(1, max_size)
        file_obj = tempfile.NamedTemporaryFile("wb+", suffix=".img",
                                               delete=delete, dir=directory,
                                               prefix="rand_hole_%d_" % i)
        file_obj.truncate(size)
        blocks_cnt = (size + block_size - 1) // block_size
        yield (file_obj, size, [], [(0, blocks_cnt - 1)])
        file_obj.close()

    #
    # Generate a random sparse files
    #

    # The maximum size
    file_obj = tempfile.NamedTemporaryFile("wb+", prefix="sparse_",
                                           delete=delete, dir=directory,
                                           suffix=".img")
    mapped, unmapped = _create_random_sparse_file(file_obj, max_size)
    yield (file_obj, max_size, mapped, unmapped)
    file_obj.close()

    # The maximum size + 1 byte
    file_obj = tempfile.NamedTemporaryFile("wb+", prefix="sparse_plus_1_",
                                           delete=delete, dir=directory,
                                           suffix=".img")
    mapped, unmapped = _create_random_sparse_file(file_obj, max_size + 1)
    yield (file_obj, max_size + 1, mapped, unmapped)
    file_obj.close()

    # The maximum size - 1 byte
    file_obj = tempfile.NamedTemporaryFile("wb+", prefix="sparse_minus_1_",
                                           delete=delete, dir=directory,
                                           suffix=".img")
    mapped, unmapped = _create_random_sparse_file(file_obj, max_size - 1)
    yield (file_obj, max_size - 1, mapped, unmapped)
    file_obj.close()

    # And 10 files of random size
    for i in range(10):
        size = random.randint(1, max_size)
        file_obj = tempfile.NamedTemporaryFile("wb+", suffix=".img",
                                               delete=delete, dir=directory,
                                               prefix="sparse_%d_" % i)
        mapped, unmapped = _create_random_sparse_file(file_obj, size)
        yield (file_obj, size, mapped, unmapped)
        file_obj.close()

    #
    # Generate random fully-mapped files
    #

    # A block-sized file
    file_obj = tempfile.NamedTemporaryFile("wb+", prefix="4Kmapped_",
                                           delete=delete, dir=directory,
                                           suffix=".img")
    _create_random_file(file_obj, block_size)
    yield (file_obj, block_size, [(0, 0)], [])
    file_obj.close()

    # A block size + 1 byte file
    file_obj = tempfile.NamedTemporaryFile("wb+", prefix="4Kmapped_plus_1_",
                                           delete=delete, dir=directory,
                                           suffix=".img")
    _create_random_file(file_obj, block_size + 1)
    yield (file_obj, block_size + 1, [(0, 1)], [])
    file_obj.close()

    # A block size - 1 byte file
    file_obj = tempfile.NamedTemporaryFile("wb+", prefix="4Kmapped_minus_1_",
                                           delete=delete, dir=directory,
                                           suffix=".img")
    _create_random_file(file_obj, block_size - 1)
    yield (file_obj, block_size - 1, [(0, 0)], [])
    file_obj.close()

    # A 1-byte file
    file_obj = tempfile.NamedTemporaryFile("wb+", prefix="1byte_mapped_",
                                           delete=delete, dir=directory,
                                           suffix=".img")
    _create_random_file(file_obj, 1)
    yield (file_obj, 1, [(0, 0)], [])
    file_obj.close()

    # And 10 mapped files of random size
    for i in range(10):
        size = random.randint(1, max_size)
        file_obj = tempfile.NamedTemporaryFile("wb+", suffix=".img",
                                               delete=delete, dir=directory,
                                               prefix="rand_mapped_%d_" % i)
        _create_random_file(file_obj, size)
        blocks_cnt = (size + block_size - 1) // block_size
        yield (file_obj, size, [(0, blocks_cnt - 1)], [])
        file_obj.close()


def calculate_chksum(file_path):
    """Calculates checksum for the contents of file 'file_path'."""

    file_obj = TransRead.TransRead(file_path)
    hash_obj = hashlib.new("sha256")

    chunk_size = 1024 * 1024

    while True:
        chunk = file_obj.read(chunk_size)
        if not chunk:
            break
        hash_obj.update(chunk)

    file_obj.close()
    return hash_obj.hexdigest()


def copy_and_verify_image(image, dest, bmap, image_chksum, image_size):
    """
    Copy image 'image' using bmap file 'bmap' to the destination file 'dest'
    and verify the resulting image checksum.
    """

    f_image = TransRead.TransRead(image)
    f_dest = open(dest, "w+b")
    if (bmap):
        f_bmap = open(bmap, "r")
    else:
        f_bmap = None

    writer = BmapCopy.BmapCopy(f_image, f_dest, f_bmap, image_size)
    # Randomly decide whether we want the progress bar or not
    if bool(random.getrandbits(1)) and sys.stdout.isatty():
        writer.set_progress_indicator(sys.stdout, None)
    writer.copy(bool(random.getrandbits(1)), bool(random.getrandbits(1)))

    # Compare the original file and the copy are identical
    assert calculate_chksum(dest) == image_chksum

    if f_bmap:
        f_bmap.close()
    f_dest.close()
    f_image.close()
