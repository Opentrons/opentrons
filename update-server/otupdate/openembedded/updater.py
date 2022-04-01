"""OE Updater and dependency injection classes."""
import contextlib
import lzma
import os
import shutil
import tempfile

from otupdate.common.update_actions import UpdateActionsInterface, Partition
from typing import Callable
import enum
import subprocess

import logging

UPDATE_PKG = "ot3-system.zip"
ROOTFS_SIG_NAME = "rootfs.xz.hash.sig"
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
            with lzma.open(rootfs_filepath, "rb") as fsrc, open(
                part.path, "wb"
            ) as fdst:
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
        with tempfile.TemporaryDirectory(
            dir=self.part_mngr.mountpoint_root()
        ) as mountpoint:
            subprocess.check_output(["mount", part_path, mountpoint])
            LOG.info(f"mounted {part_path} to {mountpoint}")
            try:
                yield mountpoint
            finally:
                subprocess.check_output(["umount", mountpoint])
                LOG.info(f"Unmounted {part_path} from {mountpoint}")

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

        Function expects the update file to be a .xz compressed file

        """

        unused_partition = self.part_mngr.find_unused_partition()
        self.root_FS_intf.write_update(
            downloaded_update_path, unused_partition, progress_callback
        )

    def verify_check_sum(self) -> bool:
        pass
