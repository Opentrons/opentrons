"""OE Updater and dependency injection classes."""
import contextlib
import lzma
import os
import shutil
import tempfile

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
ROOTFS_HASH_NAME = "rootfs.xz.md5sum"
ROOTFS_NAME = "rootfs.xz"
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
        which = subprocess.check_output(["fw_printenv", "-n", "root_part"]).strip()
        return {
            b"2": RootPartitions.THREE.value,
            b"3": RootPartitions.TWO.value,
            # if output is empty, current part is 2, set unused to 3!
            b"": RootPartitions.THREE.value,
        }[which]

    def switch_partition(self) -> Partition:
        unused_partition = self.find_unused_partition()
        if unused_partition.number == 2:
            subprocess.run(["fw_setenv", "root_part", "2"])
        else:
            subprocess.run(["fw_setenv", "root_part", "3"])
        return {
            2: RootPartitions.TWO.value,
            3: RootPartitions.THREE.value,
        }[unused_partition.number]

    def mountpoint_root(self):
        """provides mountpoint location for :py:meth:`mount_update`.

        exists only for ease of mocking
        """
        return "/mnt"


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
        try:
            with lzma.open(rootfs_filepath, "rb") as fsrc, open(part.path, "wb") as fdst:
                try:
                    shutil.copyfileobj(fsrc, fdst, length=chunk_size)
                    written_size += chunk_size
                    progress_callback(written_size / total_size)
                except Exception:
                    LOG.exception("RootFSInterface::write_update exception writing")
        except Exception:
            LOG.exception("RootFSInterface::write_update exception reading")


class Updater(UpdateActionsInterface):
    """OE updater class."""

    def __init__(self, root_FS_intf: RootFSInterface, part_mngr: PartitionManager):
        self.root_FS_intf = root_FS_intf
        self.part_mngr = part_mngr

    def commit_update(self) -> None:
        """Switch the target boot partition."""
        unused = self.part_mngr.find_unused_partition()
        new = self.part_mngr.switch_partition()
        if new != unused:
            msg = f"Bad switch: switched to {new} when {unused} was unused"
            LOG.error(msg)
            raise RuntimeError(msg)
        else:
            LOG.info(f"commit_update: committed to booting {new}")

    @contextlib.contextmanager
    def mount_update(self):
        """Mount the freshly-written partition r/w (to update machine-id).

        Should be used as a context manager, and the yielded value is the path
        to the mount. When the context manager exits, the partition will be
        unmounted again and its mountpoint removed.

        :param mountpoint_in: The directory in which to create the mountpoint.
        """
        unused = self.part_mngr.find_unused_partition()
        part_path = unused.path
        with tempfile.TemporaryDirectory(dir=self.part_mngr.mountpoint_root()) as mountpoint:
            subprocess.check_output(["mount", part_path, mountpoint])
            LOG.info(f"mounted {part_path} to {mountpoint}")
            try:
                yield mountpoint
            finally:
                subprocess.check_output(["umount", mountpoint])
                LOG.info(f"Unmounted {part_path} from {mountpoint}")

    def validate_update(
        self,
        filepath: str,
        progress_callback: Callable[[float], None],
        cert_path: Optional[str],
    ):
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
        rootfs_hash = hash_file(
            rootfs, hash_callback, file_size=sizes[ROOTFS_NAME], algo="md5"
        )
        hashfile = files.get(ROOTFS_HASH_NAME)
        assert hashfile
        packaged_hash = open(hashfile, "rb").read().strip().split()[0]
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
        self.decomp_and_write(rootfs_filepath, progress_callback)
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
        """

        unused_partition = self.part_mngr.find_unused_partition()
        self.root_FS_intf.write_update(
            downloaded_update_path, unused_partition, progress_callback
        )
        # switch to partition with the updated rootfs
        # self.part_mngr.switch_partition()

    def verify_check_sum(self) -> bool:
        pass
