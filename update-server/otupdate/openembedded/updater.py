"""OE Updater and dependency injection classes."""
import contextlib

from otupdate.common.update_actions import UpdateActionsInterface, Partition
from typing import Callable, Optional
import enum
import subprocess

from otupdate.common.file_actions import (
    unzip_update,
    hash_file,
    verify_signature,
    HashMismatch,
)

import logging

ROOTFS_SIG_NAME = "rootfs.ext4.hash.sig"
ROOTFS_HASH_NAME = "rootfs.ext4.hash"
ROOTFS_NAME = "rootfs.ext4"
UPDATE_FILES = [ROOTFS_NAME, ROOTFS_SIG_NAME, ROOTFS_HASH_NAME]

LOG = logging.getLogger(__name__)


class RootPartitions(enum.Enum):
    TWO: Partition = Partition(2, "/dev/mmcblk0p2")
    THREE: Partition = Partition(3, "/dev/mmcblk0p3")


class PartitionManager:
    """Partition manager class."""

    def find_unused_partition(self) -> Partition:
        """Find unused partition"""
        # fw_printenv -n root_part gives the currently
        # active root_fs partition, find that, and
        # set other partition as unused partition!
        which = subprocess.check_output(["fw_printenv", "-n", "root_part"])
        return {
            b"2": RootPartitions.THREE.value,
            b"3": RootPartitions.TWO.value,
            # if output is empty, current part is 2, set unused to 3!
            b"\n": RootPartitions.THREE.value,
        }[which]

    def switch_partition(self):
        unused_partition = self.find_unused_partition()
        if unused_partition.value.number == 2:
            subprocess.check_output("fw_setenv root_part 2")
        else:
            subprocess.check_output("fw_setenv root_part 3")


class RootFSInterface:
    """RootFS interface class."""

    def write_file(
        self,
        infile: str,
        outfile: str,
        progress_callback: Callable[[float], None],
        chunk_size: int = 1024,
        file_size: int = None,
    ):
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


class Updater(UpdateActionsInterface):
    """OE updater class."""

    def __init__(self, root_FS_intf: RootFSInterface, part_mngr: PartitionManager):
        self.root_FS_intf = root_FS_intf
        self.part_mngr = part_mngr

    def commit_update(self) -> None:
        """
        Command the hardware to boot from the freshly-updated filesystem
        """
        pass

    @contextlib.contextmanager
    def mount_update(self):
        """
        Mount the fs to overwrite with the update
        """
        pass

    def validate_update(
        self,
        filepath: str,
        progress_callback: Callable[[float], None],
        cert_path: Optional[str],
    ):
        """
        Worker for validation. Call in an executor (so it can return things)

        -Unzips filepath to directory
        -Hashes the rootfs inside
        -If requested, checks the signature of the hash
        :param filepath: The path to update zip file
        :param progress_callback: The function call with progress between 0
                                  and 1.0. May never reach precisely 1.0, best
                                  only for user information
        :param cert_path: Path to an x.509 certificate to check the signature
                          against. If ``None``, signature checking is disabled
        :return str: Path to the rootfs file ti update

        Will also raise an exception if validation fails
        """

        def zip_callback(progress):
            progress_callback(progress / 2.0)

        required = [ROOTFS_NAME, ROOTFS_HASH_NAME]
        if cert_path:
            required.append(ROOTFS_SIG_NAME)
        files, sizes = unzip_update(filepath, zip_callback, UPDATE_FILES, required)

        def hash_callback(progress):
            progress_callback(progress / 2.0 + 0.5)

        rootfs = files.get(ROOTFS_NAME)
        assert rootfs
        rootfs_hash = hash_file(rootfs, hash_callback, file_size=sizes[ROOTFS_NAME])
        hashfile = files.get(ROOTFS_HASH_NAME)
        assert hashfile
        packaged_hash = open(hashfile, "rb").read().strip()
        if packaged_hash != rootfs_hash:
            msg = (
                f"Hash mismatched: calculated {rootfs_hash!r} != "
                f"packaged {packaged_hash!r}"
            )
            LOG.error(msg)
            raise HashMismatch(msg)

        if cert_path:
            sigfile = files.get(ROOTFS_SIG_NAME)
            assert sigfile
            verify_signature(hashfile, sigfile, cert_path)

        return rootfs

    def write_machine_id(self, current_root: str, new_root: str) -> None:
        """Copy the machine id over to the new partition"""
        pass

    def write_update(
        self,
        rootfs_filepath: str,
        progress_callback: Callable[[float], None],
        chunk_size: int = 1024,
        file_size: int = None,
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
        unused_partition = self.part_mngr.find_unused_partition()
        self.root_FS_intf.write_file(
            rootfs_filepath,
            unused_partition.path,
            progress_callback,
            chunk_size,
            file_size,
        )
        return unused_partition

    def verify_check_sum(self) -> bool:
        pass
