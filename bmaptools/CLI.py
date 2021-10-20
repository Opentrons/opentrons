#!/usr/bin/env python
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
A tool for creating block maps (bmap) and copying disk images using bmap files.
Documentation can be found here:
source.tizen.org/documentation/reference/bmaptool
"""

# Disable the following pylint recommendations:
#   * Too few public methods (R0903)
#   * Too many statements (R0915)
#   * Too many branches (R0912)
# pylint: disable=R0903
# pylint: disable=R0915
# pylint: disable=R0912

import argparse
import sys
import os
import stat
import time
import logging
import tempfile
import traceback
import shutil
import io
from bmaptools import BmapCreate, BmapCopy, BmapHelpers, TransRead

VERSION = "3.6"

log = logging.getLogger()  # pylint: disable=C0103

def print_error_with_tb(msgformat, *args):
    """Print an error message occurred along with the traceback."""

    tback = []

    if sys.exc_info()[0]:
        lines = traceback.format_exc().splitlines()
    else:
        lines = [line.strip() for line in traceback.format_stack()]

    idx = 0
    last_idx = len(lines) - 1
    while idx < len(lines):
        if lines[idx].startswith('  File "'):
            idx += 2
            last_idx = idx
        else:
            idx += 1

    tback = lines[0:last_idx]
    if tback:
        log.error("An error occurred, here is the traceback:\n%s\n", "\n".join(tback))

    if args:
        errmsg = msgformat % args
    else:
        errmsg = str(msgformat)
    log.error(errmsg)


def error_out(msgformat, *args):
    """Print an error message and terminate program execution."""

    print_error_with_tb(str(msgformat) + "\n", *args)
    raise SystemExit(1)


class NamedFile(object):
    """
    This simple class allows us to override the 'name' attribute of a file
    object. The reason is that some classes use the 'name' attribute of the
    file object to print file path. But, for example, 'os.fdopen()' sets the
    name to "<fdopen>", which is not very user-friendly. Also, sometimes we
    want to substitute the file name with something else.
    """

    def __init__(self, file_obj, name):
        self._file_obj = file_obj
        self.name = name

    def __getattr__(self, name):
        return getattr(self._file_obj, name)

def open_block_device(path):
    """
    This is a helper function for 'open_files()' which is called if the
    destination file of the "copy" command is a block device. We handle block
    devices a little bit different to regular files. Namely, we are trying to
    make sure that we do not write to a mounted block device, otherwise the
    user could corrupt, say, the root file system by a mistake. This is
    achieved by opening the block device in exclusive mode, which guarantees
    that we are the only users of the block device.

    This function opens a block device specified by 'path' in exclusive mode.
    Returns opened file object.
    """

    try:
        descriptor = os.open(path, os.O_WRONLY | os.O_EXCL)
    except OSError as err:
        error_out("cannot open block device '%s' in exclusive mode: %s",
                  path, err)

    # Turn the block device file descriptor into a file object
    try:
        file_obj = os.fdopen(descriptor, "wb")
    except OSError as err:
        os.close(descriptor)
        error_out("cannot open block device '%s':\n%s", path, err)

    return NamedFile(file_obj, path)

def report_verification_results(context, sigs):
    """
    This is a helper function which reports the GPG signature verification
    results. The 'context' argument is the gpgme context object, and the 'sigs'
    argument contains the results of the 'gpgme.verify()' function.
    """

    for sig in sigs:
        if not sig.status:
            key = context.get_key(sig.fpr)
            author = "%s <%s>" % (key.uids[0].name, key.uids[0].email)
            log.info("successfully verified bmap file signature of %s "
                     "(fingerprint %s)" % (author, sig.fpr))
        else:
            error_out("signature verification failed (fingerprint %s): %s\n"
                      "Either fix the problem or use --no-sig-verify to "
                      "disable signature verification",
                      sig.fpr, sig.status[2].lower())

def verify_detached_bmap_signature(args, bmap_obj, bmap_path):
    """
    This is a helper function for 'verify_bmap_signature()' which handles the
    detached signature case.
    """

    if args.no_sig_verify:
        return None

    if args.bmap_sig:
        try:
            sig_obj = TransRead.TransRead(args.bmap_sig)
        except TransRead.Error as err:
            error_out("cannot open bmap signature file '%s':\n%s",
                      args.bmap_sig, err)
        sig_path = args.bmap_sig
    else:
        # Check if there is a stand-alone signature file
        try:
            sig_path = bmap_path + ".asc"
            sig_obj = TransRead.TransRead(sig_path)
        except TransRead.Error:
            try:
                sig_path = bmap_path + ".sig"
                sig_obj = TransRead.TransRead(sig_path)
            except TransRead.Error:
                # No signatures found
                return None

        log.info("discovered signature file for bmap '%s'" % sig_path)

    # If the stand-alone signature file is not local, make a local copy
    if sig_obj.is_url:
        try:
            tmp_obj = tempfile.NamedTemporaryFile("wb+")
        except IOError as err:
            error_out("cannot create a temporary file for the signature:\n%s",
                      err)

        shutil.copyfileobj(sig_obj, tmp_obj)
        tmp_obj.seek(0)
        sig_obj.close()
        sig_obj = tmp_obj

    try:
        import gpgme
    except ImportError:
        error_out("cannot verify the signature because the python \"gpgme\" "
                  "module is not installed on your system\nPlease, either "
                  "install the module or use --no-sig-verify")

    try:
        context = gpgme.Context()
        signature = io.FileIO(sig_obj.name)
        signed_data = io.FileIO(bmap_obj.name)
        sigs = context.verify(signature, signed_data, None)
    except gpgme.GpgmeError as err:
        error_out("failure when trying to verify GPG signature: %s\n"
                  "Make sure file \"%s\" has proper GPG format",
                  err[2].lower(), sig_path)

    sig_obj.close()

    if len(sigs) == 0:
        log.warning("the \"%s\" signature file does not actually contain "
                    "any valid signatures" % sig_path)
    else:
        report_verification_results(context, sigs)

    return None


def verify_clearsign_bmap_signature(args, bmap_obj):
    """
    This is a helper function for 'verify_bmap_signature()' which handles the
    clarsign signature case.
    """

    if args.bmap_sig:
        error_out("the bmap file has clearsign format and already contains "
                  "the signature, so --bmap-sig option should not be used")

    try:
        import gpgme
    except ImportError:
        error_out("cannot verify the signature because the python \"gpgme\""
                  "module is not installed on your system\nCannot extract "
                  "block map from the bmap file which has clearsign format, "
                  "please, install the module")

    try:
        context = gpgme.Context()
        signature = io.FileIO(bmap_obj.name)
        plaintext = io.BytesIO()
        sigs = context.verify(signature, None, plaintext)
    except gpgme.GpgmeError as err:
        error_out("failure when trying to verify GPG signature: %s\n"
                  "make sure the bmap file has proper GPG format",
                  err[2].lower())

    if not args.no_sig_verify:
        if len(sigs) == 0:
            log.warning("the bmap file clearsign signature does not actually "
                        "contain any valid signatures")
        else:
            report_verification_results(context, sigs)

    try:
        tmp_obj = tempfile.TemporaryFile("w+")
    except IOError as err:
        error_out("cannot create a temporary file for bmap:\n%s", err)

    tmp_obj.write(plaintext.getvalue())
    tmp_obj.seek(0)
    return tmp_obj


def verify_bmap_signature(args, bmap_obj, bmap_path):
    """
    Verify GPG signature of the bmap file if it is present. The signature may
    be in a separate file (detached) or it may be inside the bmap file itself
    (clearsign signature).

    If user specifies the --bmap-sig option, the signature is assumed to be
    detached and is taken from the user-specified file. Otherwise, this
    function verifies whether the bmap file has clearsign signature, and if
    not, it tries to automatically discover the detached signature by searching
    for a ".sig" or ".asc" file at the same path and with the same basename as
    the bmap file. This function then verifies the signature and reports the
    results.

    In case of the clearsign signature, the bmap file has "invalid" format,
    meaning that the proper bmap XML contents is in the GPG clearsign
    container. The XML contents has to be extracted from the container before
    further processing. And this is be done even if user specified the
    --no-sig-verify option. This function returns an open file object with the
    extracted XML bmap file contents in this case. Otherwise, this function
    returns None.
    """

    if not bmap_obj:
        return None

    clearsign_marker = "-----BEGIN PGP SIGNED MESSAGE-----"
    buf = bmap_obj.read(len(clearsign_marker))
    bmap_obj.seek(0)

    if buf == clearsign_marker:
        return verify_clearsign_bmap_signature(args, bmap_obj)
    else:
        return verify_detached_bmap_signature(args, bmap_obj, bmap_path)


def find_and_open_bmap(args):
    """
    This is a helper function for 'open_files()' which discovers and opens the
    bmap file, then returns the corresponding file object and the bmap file
    path.

    If the user specified the bmap file explicitly, we just open the provided
    path. Otherwise, we try to discover the bmap file at the same place where
    the image file is located. We search for a file with the same path and
    basename, but with a ".bmap" extension.

    Additionally, this function makes sure that the returned file object
    corresponds to a local file, not a remote file. We do this by creating a
    temporary local copy of the bmap file. The reason is that further on we may
    need to check the GPG signature of the file, which requires it to be a
    local file. On top of that, the BmapCopy class requires the bmap file to be
    memory-mappable ('mmap()').
    """

    if args.nobmap:
        return (None, None)

    if args.bmap:
        try:
            bmap_obj = TransRead.TransRead(args.bmap)
        except TransRead.Error as err:
            error_out("cannot open bmap file '%s':\n%s", args.bmap, err)
        bmap_path = args.bmap
    else:
        # Automatically discover the bmap file
        image_path = args.image
        while True:
            bmap_path = image_path + ".bmap"
            try:
                bmap_obj = TransRead.TransRead(bmap_path)
                log.info("discovered bmap file '%s'" % bmap_path)
                break
            except TransRead.Error:
                pass

            image_path, ext = os.path.splitext(image_path)
            if ext == '':
                return (None, None)

    if not bmap_obj.is_url:
        return (bmap_obj, bmap_path)

    try:
        # Create a temporary file for the bmap
        tmp_obj = tempfile.NamedTemporaryFile("wb+")
    except IOError as err:
        error_out("cannot create a temporary file for bmap:\n%s", err)

    shutil.copyfileobj(bmap_obj, tmp_obj)

    tmp_obj.flush()
    tmp_obj.seek(0)
    bmap_obj.close()
    return (tmp_obj, bmap_path)


def open_files(args):
    """
    This is a helper function for 'copy_command()' which the image, bmap, and
    the destination files. Returns a tuple of 5 elements:
        1 file-like object for the image
        2 file object for the destination file
        3 file-like object for the bmap
        4 full path to the bmap file
        5 image size in bytes
        6 'True' if the destination file is a block device, otherwise 'False'
    """

    # Open the image file using the TransRead module, which will automatically
    # recognize whether it is compressed or whether file path is an URL, etc.
    try:
        image_obj = TransRead.TransRead(args.image)
    except TransRead.Error as err:
        error_out("cannot open image:\n%s" % err)

    # Open the bmap file. Try to discover the bmap file automatically if it
    # was not specified.
    (bmap_obj, bmap_path) = find_and_open_bmap(args)

    if bmap_path == args.image:
        # Most probably the user specified the bmap file instead of the image
        # file by mistake.
        bmap_obj.close()
        error_out("Make sure you are writing your image and not the bmap file "
                  "(you specified the same path for them)")

    # If the destination file is under "/dev", but does not exist, print a
    # warning. This is done in order to be more user-friendly, because
    # sometimes users mean to write to a block device, them misspell its name.
    # We just create the "/dev/misspelled" file, write the data there, and
    # report success. Later on the user finds out that the image was not really
    # written to the device, and gets confused. Similar confusion may happen if
    # the destination file is not a special device for some reasons.
    if os.path.normpath(args.dest).startswith("/dev/"):
        if not os.path.exists(args.dest):
            log.warning("\"%s\" does not exist, creating a regular file "
                        "\"%s\"" % (args.dest, args.dest))
        elif stat.S_ISREG(os.stat(args.dest).st_mode):
            log.warning("\"%s\" is under \"/dev\", but it is a regular file, "
                        "not a device node" % args.dest)

    # Try to open the destination file. If it does not exist, a new regular
    # file will be created. If it exists and it is a regular file - it'll be
    # truncated. If this is a block device, it'll just be opened.
    try:
        dest_obj = open(args.dest, 'wb+')
    except IOError as err:
        error_out("cannot open destination file '%s':\n%s", args.dest, err)

    # Check whether the destination file is a block device
    dest_is_blkdev = stat.S_ISBLK(os.fstat(dest_obj.fileno()).st_mode)
    if dest_is_blkdev:
        dest_obj.close()
        dest_obj = open_block_device(args.dest)

    return (image_obj, dest_obj, bmap_obj, bmap_path, image_obj.size,
            dest_is_blkdev)


def copy_command(args):
    """Copy an image to a block device or a regular file using bmap."""

    if args.nobmap and args.bmap:
        error_out("--nobmap and --bmap cannot be used together")

    if args.bmap_sig and args.no_sig_verify:
        error_out("--bmap-sig and --no-sig-verify cannot be used together")

    image_obj, dest_obj, bmap_obj, bmap_path, image_size, dest_is_blkdev = \
        open_files(args)

    if args.bmap_sig and not bmap_obj:
        error_out("the bmap signature file was specified, but bmap file was "
                  "not found")

    f_obj = verify_bmap_signature(args, bmap_obj, bmap_path)
    if f_obj:
        bmap_obj.close()
        bmap_obj = f_obj

    if bmap_obj:
        bmap_obj = NamedFile(bmap_obj, bmap_path)

    try:
        if dest_is_blkdev:
            dest_str = "block device '%s'" % args.dest
            # For block devices, use the specialized class
            writer = BmapCopy.BmapBdevCopy(image_obj, dest_obj, bmap_obj,
                                           image_size)
        else:
            dest_str = "file '%s'" % os.path.basename(args.dest)
            writer = BmapCopy.BmapCopy(image_obj, dest_obj, bmap_obj,
                                       image_size)
    except BmapCopy.Error as err:
        error_out(err)

    # Print the progress indicator while copying
    if not args.quiet and not args.debug and \
       sys.stderr.isatty() and sys.stdout.isatty():
        writer.set_progress_indicator(sys.stderr, "bmaptool: info: %d%% copied")

    start_time = time.time()
    if not bmap_obj:
        if args.nobmap:
            log.info("no bmap given, copy entire image to '%s'" % args.dest)
        else:
            error_out("bmap file not found, please, use --nobmap option to "
                      "flash without bmap")
    else:
        log.info("block map format version %s" % writer.bmap_version)
        log.info("%d blocks of size %d (%s), mapped %d blocks (%s or %.1f%%)"
                 % (writer.blocks_cnt, writer.block_size,
                    writer.image_size_human, writer.mapped_cnt,
                    writer.mapped_size_human, writer.mapped_percent))
        log.info("copying image '%s' to %s using bmap file '%s'"
                 % (os.path.basename(args.image), dest_str,
                    os.path.basename(bmap_path)))

    if args.psplash_pipe:
        writer.set_psplash_pipe(args.psplash_pipe)

    try:
        try:
            writer.copy(False, not args.no_verify)
        except (BmapCopy.Error, TransRead.Error) as err:
            error_out(err)

        # Synchronize the block device
        log.info("synchronizing '%s'" % args.dest)
        try:
            writer.sync()
        except BmapCopy.Error as err:
            error_out(err)
    except KeyboardInterrupt:
        error_out("interrupted, exiting")

    copying_time = time.time() - start_time
    copying_speed = writer.mapped_size // copying_time
    log.info("copying time: %s, copying speed %s/sec"
             % (BmapHelpers.human_time(copying_time),
                BmapHelpers.human_size(copying_speed)))

    dest_obj.close()
    if bmap_obj:
        bmap_obj.close()
    image_obj.close()


def create_command(args):
    """
    Generate block map (AKA bmap) for an image. The idea is that while images
    files may generally be very large (e.g., 4GiB), they may nevertheless
    contain only little real data, e.g., 512MiB. This data are files,
    directories, file-system meta-data, partition table, etc. When copying the
    image to the target device, you do not have to copy all the 4GiB of data,
    you can copy only 512MiB of it, which is 4 times less, so copying should
    presumably be 4 times faster.

    The block map file is an XML file which contains a list of blocks which
    have to be copied to the target device. The other blocks are not used and
    there is no need to copy them. The XML file also contains some additional
    information like block size, image size, count of mapped blocks, etc. There
    are also many commentaries, so it is human-readable.

    The image has to be a sparse file. Generally, this means that when you
    generate this image file, you should start with a huge sparse file which
    contains a single hole spanning the entire file. Then you should partition
    it, write all the data (probably by means of loop-back mounting the image
    or parts of it), etc. The end result should be a sparse file where mapped
    areas represent useful parts of the image and holes represent useless parts
    of the image, which do not have to be copied when copying the image to the
    target device.
    """

    # Create and setup the output stream
    if args.output:
        try:
            output = open(args.output, "w+")
        except IOError as err:
            error_out("cannot open the output file '%s':\n%s", args.output, err)
    else:
        try:
            # Create a temporary file for the bmap
            output = tempfile.TemporaryFile("w+")
        except IOError as err:
            error_out("cannot create a temporary file:\n%s", err)

    try:
        creator = BmapCreate.BmapCreate(args.image, output, "sha256")
        creator.generate(not args.no_checksum)
    except BmapCreate.Error as err:
        error_out(err)

    if not args.output:
        output.seek(0)
        sys.stdout.write(output.read())

    if creator.mapped_cnt == creator.blocks_cnt:
        log.warning("all %s are mapped, no holes in '%s'"
                    % (creator.image_size_human, args.image))
        log.warning("was the image handled incorrectly and holes "
                    "were expanded?")


def parse_arguments():
    """A helper function which parses the input arguments."""
    text = sys.modules[__name__].__doc__
    parser = argparse.ArgumentParser(description=text, prog='bmaptool')

    # The --version option
    parser.add_argument("--version", action="version",
                        version="%(prog)s " + "%s" % VERSION)

    # The --quiet option
    text = "be quiet"
    parser.add_argument("-q", "--quiet", action="store_true", help=text)

    # The --debug option
    text = "print debugging information"
    parser.add_argument("-d", "--debug", action="store_true", help=text)

    subparsers = parser.add_subparsers(title="commands", dest="command")
    subparsers.required = True

    #
    # Create parser for the "create" command
    #
    text = "generate bmap for an image file (which should be a sparse file)"
    parser_create = subparsers.add_parser("create", help=text)
    parser_create.set_defaults(func=create_command)

    # Mandatory command-line argument - image file
    text = "the image to generate bmap for"
    parser_create.add_argument("image", help=text)

    # The --output option
    text = "the output file name (otherwise stdout is used)"
    parser_create.add_argument("-o", "--output", help=text)

    # The --no-checksum option
    text = "do not generate the checksum for block ranges in the bmap"
    parser_create.add_argument("--no-checksum", action="store_true", help=text)

    #
    # Create parser for the "copy" command
    #
    text = "write an image to a block device using bmap"
    parser_copy = subparsers.add_parser("copy", help=text)
    parser_copy.set_defaults(func=copy_command)

    # The first positional argument - image file
    text = "the image file to copy. Supported formats: uncompressed, " + \
           ", ".join(TransRead.SUPPORTED_COMPRESSION_TYPES)
    parser_copy.add_argument("image", help=text)

    # The second positional argument - block device node
    text = "the destination file or device node to copy the image to"
    parser_copy.add_argument("dest", help=text)

    # The --bmap option
    text = "the block map file for the image"
    parser_copy.add_argument("--bmap", help=text)

    # The --nobmap option
    text = "allow copying without a bmap file"
    parser_copy.add_argument("--nobmap", action="store_true", help=text)

    # The --bmap-sig option
    text = "the detached GPG signature for the bmap file"
    parser_copy.add_argument("--bmap-sig", help=text)

    # The --no-sig-verify option
    text = "do not verify bmap file GPG signatrue"
    parser_copy.add_argument("--no-sig-verify", action="store_true", help=text)

    # The --no-verify option
    text = "do not verify the data checksum while writing"
    parser_copy.add_argument("--no-verify", action="store_true", help=text)

    # The --psplash-pipe option
    text = "write progress to a psplash pipe"
    parser_copy.add_argument("--psplash-pipe", help=text)

    return parser.parse_args()


def setup_logger(loglevel):
    """
    A helper function which configures the root logger. The log level is
    initialized to 'loglevel'.
    """

    # Esc-sequences for coloured output
    esc_red = '\033[91m'     # pylint: disable=W1401
    esc_yellow = '\033[93m'  # pylint: disable=W1401
    esc_green = '\033[92m'   # pylint: disable=W1401
    esc_end = '\033[0m'      # pylint: disable=W1401

    class MyFormatter(logging.Formatter):
        """
        A custom formatter for logging messages. The reason we have it is to
        have different format for different log levels.
        """

        def __init__(self, fmt=None, datefmt=None):
            """The constructor."""
            logging.Formatter.__init__(self, fmt, datefmt)

            self._orig_fmt = self._fmt
            # Prefix with green-colored time-stamp, as well as with module name
            # and line number
            self._dbg_fmt = "[" + esc_green + "%(asctime)s" + esc_end + \
                            "] [%(module)s,%(lineno)d] " + self._fmt

        def format(self, record):
            """
            The formatter which which simply prefixes all debugging messages
            with a time-stamp.
            """

            if record.levelno == logging.DEBUG:
                self._fmt = self._dbg_fmt

            result = logging.Formatter.format(self, record)
            self._fmt = self._orig_fmt
            return result

    # Change log level names to something nicer than the default all-capital
    # 'INFO' etc.
    logging.addLevelName(logging.ERROR, esc_red + "ERROR" + esc_end)
    logging.addLevelName(logging.WARNING, esc_yellow + "WARNING" + esc_end)
    logging.addLevelName(logging.DEBUG, "debug")
    logging.addLevelName(logging.INFO, "info")

    log.setLevel(loglevel)
    formatter = MyFormatter("bmaptool: %(levelname)s: %(message)s", "%H:%M:%S")
    where = logging.StreamHandler(sys.stderr)
    where.setFormatter(formatter)
    log.addHandler(where)


def main():
    """Script entry point."""
    args = parse_arguments()

    if args.quiet:
        loglevel = logging.WARNING
    elif args.debug:
        loglevel = logging.DEBUG
    else:
        loglevel = logging.INFO

    setup_logger(loglevel)

    if args.quiet and args.debug:
        error_out("--quiet and --debug cannot be used together")

    try:
        args.func(args)
    except MemoryError:
        log.error("Out of memory!")
        traceback.print_exc()

        log.info("The contents of /proc/meminfo:")
        with open('/proc/meminfo', 'rt') as file_obj:
            for line in file_obj:
                print(line.strip())

        log.info("The contents of /proc/self/status:")
        with open('/proc/self/status', 'rt') as file_obj:
            for line in file_obj:
                print(line.strip())

if __name__ == "__main__":
    sys.exit(main())
