"""
 otupdate.buildroot.update_actions: what files to expect and what to do with them

This module has functions that actually accomplish the various tasks required
for an update: unzipping update files, hashing rootfs, checking signatures,
writing to root partitions
"""
import contextlib
import enum
import logging
import os
import re
import subprocess
import tempfile
from typing import Callable, Generator, Optional

from otupdate.common.constants import MODEL_OT2

from otupdate.common.file_actions import (
    InvalidPKGName,
    InvalidRobotType,
    load_version_file,
    unzip_update,
    hash_file,
    HashMismatch,
    verify_signature,
)
from otupdate.common.update_actions import UpdateActionsInterface, Partition

UPDATE_PKG_BR = ["ot2-system.zip", "system-update.zip"]
UPDATE_PKG_VERSION_FILE = "VERSION.json"
ROOTFS_SIG_NAME = "rootfs.ext4.hash.sig"
ROOTFS_HASH_NAME = "rootfs.ext4.hash"
ROOTFS_NAME = "rootfs.ext4"
UPDATE_FILES = [ROOTFS_NAME, ROOTFS_SIG_NAME, ROOTFS_HASH_NAME, UPDATE_PKG_VERSION_FILE]
LOG = logging.getLogger(__name__)


class RootPartitions(enum.Enum):
    TWO: Partition = Partition(2, "/dev/mmcblk0p2")
    THREE: Partition = Partition(3, "/dev/mmcblk0p3")


class OT2UpdateActions(UpdateActionsInterface):
    def validate_update(
        self,
        filepath: str,
        progress_callback: Callable[[float], None],
        cert_path: Optional[str],
    ) -> Optional[str]:
        """Worker for validation. Call in an executor (so it can return things)

        - Unzips filepath to its directory
        - Hashes the rootfs inside
        - If requested, checks the signature of the hash
        :param filepath: The path to the update zip file
        :param progress_callback: The function to call with progress between 0
                                  and 1.0. May never reach precisely 1.0, best
                                  only for user information
        :param cert_path: Path to an x.509 certificate to check the signature
                          against. If ``None``, signature checking is disabled

        :returns str: Path to the rootfs file to update

        Will also raise an exception if validation fails
        """

        # make sure we have the correct file
        filename = os.path.basename(filepath)
        if filename not in UPDATE_PKG_BR:
            msg = f"invalid filename {filepath} {filename}"
            LOG.error(msg)
            raise InvalidPKGName(msg)

        def zip_callback(progress):
            progress_callback(progress / 2.0)

        required = [ROOTFS_NAME, ROOTFS_HASH_NAME]
        if cert_path:
            required.append(ROOTFS_SIG_NAME)
        files, sizes = unzip_update(filepath, zip_callback, UPDATE_FILES, required)

        def hash_callback(progress):
            progress_callback(progress / 2.0 + 0.5)

        version_file = str(files.get("VERSION.json"))
        version_dict = load_version_file(version_file)
        robot_type = version_dict.get("robot_type", MODEL_OT2)
        if robot_type != MODEL_OT2:
            msg = f"Invalid robot_type: expected {MODEL_OT2} != packaged {robot_type}"
            LOG.error(msg)
            raise InvalidRobotType(msg)

        rootfs = files.get(ROOTFS_NAME)
        assert rootfs
        rootfs_hash = hash_file(rootfs, hash_callback, file_size=sizes[ROOTFS_NAME])
        hashfile = files.get(ROOTFS_HASH_NAME)
        assert hashfile
        packaged_hash = open(hashfile, "rb").read().strip()
        if packaged_hash != rootfs_hash:
            msg = (
                f"Hash mismatch: calculated {rootfs_hash!r} != "
                f"packaged {packaged_hash!r}"
            )
            LOG.error(msg)
            raise HashMismatch(msg)

        if cert_path:
            sigfile = files.get(ROOTFS_SIG_NAME)
            assert sigfile
            verify_signature(hashfile, sigfile, cert_path)

        return rootfs

    def write_update(
        self,
        rootfs_filepath: str,
        progress_callback: Callable[[float], None],
        chunk_size: int = 1024,
        file_size: Optional[int] = None,
    ) -> Partition:
        """
        Write the new rootfs to the next root partition

        - Figure out, from the system, the correct root partition to write to
        - Write the rootfs at ``rootfs_filepath`` there, with progress

        :param rootfs_filepath: The path to a checked rootfs.ext4
        :param progress_callback: A callback to call periodically with progress
                                  between 0 and 1.0. May never reach precisely
                                  1.0, best only for user information.
        :param chunk_size: The size of file chunks to copy in between progress
                           notifications
        :param file_size: The total size of the update file (for generating
                          progress percentage). If ``None``, generated with
                          ``seek``/``tell``.
        :returns: The root partition that the rootfs image was written to, e.g.
                  ``RootPartitions.TWO`` or ``RootPartitions.THREE``.
        """
        unused = _find_unused_partition()
        part_path = unused.value.path
        write_file(rootfs_filepath, part_path, progress_callback, chunk_size, file_size)
        return unused.value

    @contextlib.contextmanager
    def mount_update(self) -> Generator[str, None, None]:
        """Mount the freshly-written partition r/w (to update machine-id).

        Should be used as a context manager, and the yielded value is the path
        to the mount. When the context manager exits, the partition will be
        unmounted again and its mountpoint removed.
        """
        unused = _find_unused_partition()
        part_path = unused.value.path
        with tempfile.TemporaryDirectory(dir=_mountpoint_root()) as mountpoint:
            subprocess.check_output(["mount", part_path, mountpoint])
            LOG.info(f"mounted {part_path} to {mountpoint}")
            try:
                yield mountpoint
            finally:
                subprocess.check_output(["umount", mountpoint])
                LOG.info(f"Unmounted {part_path} from {mountpoint}")

    def commit_update(self) -> None:
        """Switch the target boot partition."""
        unused = _find_unused_partition()
        new = _switch_partition()
        if new != unused:
            msg = f"Bad switch: switched to {new} when {unused} was unused"
            LOG.error(msg)
            raise RuntimeError(msg)
        else:
            LOG.info(f"commit_update: committed to booting {new}")

    def write_machine_id(self, current_root: str, new_root: str) -> None:
        """Update the machine id in target rootfs"""
        mid = open(os.path.join(current_root, "etc", "machine-id")).read()
        with open(os.path.join(new_root, "etc", "machine-id"), "w") as new_mid:
            new_mid.write(mid)
        LOG.info(f"Wrote machine_id {mid.strip()} to {new_root}/etc/machine-id")

    def clean_up(self, download_dir: str) -> None:
        """Deletes the update contents in the download dir."""
        LOG.info(f"Cleaning up download dir {download_dir}.")
        for file in os.listdir(download_dir):
            filepath = os.path.join(download_dir, file)
            LOG.debug(f"Deleting {filepath}")
            try:
                os.remove(filepath)
            except Exception:
                LOG.exception(f"Could not delete update file {filepath}.")


def _find_unused_partition() -> RootPartitions:
    """Find the currently-unused root partition to write to"""
    which = subprocess.check_output(["ot-unused-partition"]).strip()
    return {b"2": RootPartitions.TWO, b"3": RootPartitions.THREE}[which]


def write_file(
    infile: str,
    outfile: str,
    progress_callback: Callable[[float], None],
    chunk_size: int = 1024,
    file_size: Optional[int] = None,
) -> None:
    """Write a file to another file with progress callbacks.

    :param infile: The input filepath
    :param outfile: The output filepath
    :param progress_callback: The callback to call for progress
    :param chunk_size: The size of file chunks to copy in between progress
                       notifications
    :param file_size: The total size of the update file (for generating
                      progress percentage). If ``None``, generated with
                      ``seek``/``tell``.
    """
    total_written = 0
    with open(infile, "rb") as img, open(outfile, "wb") as part:
        if None is file_size:
            file_size = img.seek(0, 2)
            img.seek(0)
            LOG.info(f"write_file: file size calculated as {file_size}B")
        LOG.info(
            f"write_file: writing {infile} ({file_size}B)"
            f" to {outfile} in {chunk_size}B chunks"
        )
        while True:
            chunk = img.read(chunk_size)
            part.write(chunk)
            total_written += len(chunk)
            progress_callback(total_written / file_size)
            if len(chunk) != chunk_size:
                break


def _mountpoint_root():
    """provides mountpoint location for :py:meth:`mount_update`.

    exists only for ease of mocking
    """
    return "/mnt"


def _switch_partition() -> RootPartitions:
    """Switch the active boot partition using the switch script"""
    res = subprocess.check_output(["ot-switch-partitions"])
    for line in res.split(b"\n"):
        matches = re.match(b"Current boot partition: ([23]), setting to ([23])", line)
        if matches:
            return {b"2": RootPartitions.TWO, b"3": RootPartitions.THREE}[
                matches.group(2)
            ]
    else:
        raise RuntimeError(f"Bad output from ot-switch-partitions: {res!r}")
