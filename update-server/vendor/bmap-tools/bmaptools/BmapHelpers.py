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
This module contains various shared helper functions.
"""

import os
import struct
import subprocess
from fcntl import ioctl
from subprocess import PIPE

# Path to check for zfs compatibility.
ZFS_COMPAT_PARAM_PATH = '/sys/module/zfs/parameters/zfs_dmu_offset_next_sync'

class Error(Exception):
    """A class for all the other exceptions raised by this module."""
    pass

def human_size(size):
    """Transform size in bytes into a human-readable form."""
    if size == 1:
        return "1 byte"

    if size < 512:
        return "%d bytes" % size

    for modifier in ["KiB", "MiB", "GiB", "TiB"]:
        size /= 1024.0
        if size < 1024:
            return "%.1f %s" % (size, modifier)

    return "%.1f %s" % (size, 'EiB')

def human_time(seconds):
    """Transform time in seconds to the HH:MM:SS format."""
    (minutes, seconds) = divmod(seconds, 60)
    (hours, minutes) = divmod(minutes, 60)

    result = ""
    if hours:
        result = "%dh " % hours
    if minutes:
        result += "%dm " % minutes

    return result + "%.1fs" % seconds

def get_block_size(file_obj):
    """
    Return block size for file object 'file_obj'. Errors are indicated by the
    'IOError' exception.
    """

    # Get the block size of the host file-system for the image file by calling
    # the FIGETBSZ ioctl (number 2).
    try:
        binary_data = ioctl(file_obj, 2, struct.pack('I', 0))
        bsize = struct.unpack('I', binary_data)[0]
        if not bsize:
            raise IOError("get 0 bsize by FIGETBSZ ioctl")
    except IOError as err:
        stat = os.fstat(file_obj.fileno())
        if hasattr(stat, 'st_blksize'):
            bsize = stat.st_blksize
        else:
            raise IOError("Unable to determine block size")
    return bsize

def program_is_available(name):
    """
    This is a helper function which check if the external program 'name' is
    available in the system.
    """

    for path in os.environ["PATH"].split(os.pathsep):
        program = os.path.join(path.strip('"'), name)
        if os.path.isfile(program) and os.access(program, os.X_OK):
            return True

    return False

def get_file_system_type(path):
    """Return the file system type for 'path'."""

    abspath = os.path.realpath(path)
    proc = subprocess.Popen(["df", "-T", "--", abspath], stdout=PIPE, stderr=PIPE)
    stdout, stderr = proc.communicate()

    # Parse the output of subprocess, for example:
    # Filesystem                Type 1K-blocks     Used Available Use% Mounted on
    # rpool/USERDATA/foo_5ucog2 zfs  456499712 86956288 369543424  20% /home/foo
    ftype = None
    if stdout:
        lines = stdout.splitlines()
        if len(lines) >= 2:
            fields = lines[1].split(None, 2)
            if len(fields) >= 2:
                ftype = fields[1].lower()

    if not ftype:
        raise Error("failed to find file system type for path at '%s'\n"
                    "Here is the 'df -T' output\nstdout:\n%s\nstderr:\n%s"
                    % (path, stdout, stderr))
    return ftype

def is_zfs_configuration_compatible():
    """Return if hosts zfs configuration is compatible."""

    path = ZFS_COMPAT_PARAM_PATH
    if not os.path.isfile(path):
        return False

    try:
        with open(path, "r") as fobj:
            return int(fobj.readline()) == 1
    except IOError as err:
        raise Error("cannot open zfs param path '%s': %s"
                    % (path, err))
    except ValueError as err:
        raise Error("invalid value read from param path '%s': %s"
                    % (path, err))

def is_compatible_file_system(path):
    """Return if paths file system is compatible."""

    fstype = get_file_system_type(path)
    if fstype == "zfs":
        return is_zfs_configuration_compatible()
    return True
