"""OE Updater and dependency injection classes."""
import contextlib
import lzma
import os
import shutil


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
            b"2\n": RootPartitions.THREE.value,
            b"3\n": RootPartitions.TWO.value,
            # if output is empty, current part is 2, set unused to 3!
            b"\n": RootPartitions.THREE.value,
        }[which]

    def switch_partition(self):
        unused_partition = self.find_unused_partition()
        if unused_partition.number == 2:
            subprocess.run(["fw_setenv", "root_part", "2"])
        else:
            subprocess.run(["fw_setenv", "root_part", "3"])


class RootFSInterface:
    """RootFS interface class."""

    def write_update(
        self,
        rootfs_filepath: str,
        part: Partition,
        progress_callback: Callable[[float], None],
        chunk_size: int = 1024,
    ) -> None:

        total_size = os.path.getsize(rootfs_filepath)
        written_size = 0

        with lzma.open(rootfs_filepath, "rb") as fsrc:
            with open(part.path, "wb") as fdst:
                shutil.copyfileobj(fsrc, fdst, length=chunk_size)
                written_size += 1024
                progress_callback(written_size / total_size)


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

        LOG.warning("Entering write_update of Updater class!")
        unused_partition = self.part_mngr.find_unused_partition()
        return unused_partition

    def decomp_and_write(
        self, downloaded_update_path: str, progress_callback: Callable[[float], None]
    ) -> None:
        """Decompress and write update to partition

        As this method is currently not performing validation
        on the update files, it's meant to be for
        internal use.

        Function expects the update file to be a .xz compressed file

        with .xz rootfs size comes out at 223M,
        gz -> bz2 -> xz   is roughly the progression over time.

        gz compression makes things slightly different from zip.
        gz/xz/bz2 is just a compression stream. and not
        a collection of files. We can apply it either to a single file, or
        something that contains many files (like a "tar" archive).
        In contrast, ZIP is both a collection + compression.

        ZIP being a collection makes things like packaging the
        rootfs along with its checksum in one file a little easier.
        We validate that all essential files are present before decompressing,
        and then compare checksums. With .xz like compression we get straight up
        blobs, so rootfs.xz would give us the actual rootfs file structure:
        rootfs.xz ===> /bin /var /etc .. ,
        whereas zip gives a collection: rootfs.zip ===> rootfs.ext4

        Note:
        Right now this function does a straight fwd, on the fly write to
        the unused partition. Checksum validation isn't being performed.
        """

        unused_partition = self.part_mngr.find_unused_partition()
        self.root_FS_intf.write_update(
            downloaded_update_path, unused_partition, progress_callback
        )
        # switch to partion with the updated rootfs
        self.part_mngr.switch_partition()

    def verify_check_sum(self) -> bool:
        pass
