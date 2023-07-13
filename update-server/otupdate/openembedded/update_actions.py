"""OE Updater and dependency injection classes."""
import os
import contextlib
import lzma
import tempfile

from otupdate.common.constants import MODEL_OT3
from otupdate.common.file_actions import (
    InvalidRobotType,
    unzip_update,
    hash_file,
    HashMismatch,
    InvalidPKGName,
    verify_signature,
    load_version_file,
)
from otupdate.common.update_actions import UpdateActionsInterface, Partition
from typing import Any, Callable, Generator, Optional, Tuple
import enum
import subprocess

import logging

UPDATE_PKG_OE = ["system-update.zip"]
UPDATE_PKG_VERSION_FILE = "VERSION.json"
ROOTFS_SIG_NAME = "systemfs.xz.hash.sig"
ROOTFS_HASH_NAME = "systemfs.xz.sha256"
ROOTFS_NAME = "systemfs.xz"
UPDATE_FILES = [ROOTFS_NAME, ROOTFS_SIG_NAME, ROOTFS_HASH_NAME, UPDATE_PKG_VERSION_FILE]

LOG = logging.getLogger(__name__)


class RootPartitions(enum.Enum):
    TWO: Partition = Partition(2, "/dev/mmcblk0p2", "/media/mmcblk0p2")
    THREE: Partition = Partition(3, "/dev/mmcblk0p3", "/media/mmcblk0p3")


class PartitionManager:
    """Partition manager class."""

    def umount_fs(self, path: str) -> bool:
        """umount file system before writing"""
        if subprocess.run(["umount", path]).returncode == 0:
            return True
        else:
            return False

    def mount_fs(self, path: str, mount_point: str) -> bool:
        """mount file system after writing"""
        if subprocess.run(["mount", path, mount_point]).returncode == 0:
            return True
        else:
            return False

    def used_partition(self) -> bytes:
        """Find used partition"""
        return subprocess.check_output(["fw_printenv", "-n", "root_part"]).strip()

    def find_unused_partition(self, which: bytes) -> Partition:
        """Find unused partition"""
        # fw_printenv -n root_part gives the currently
        # active root_fs partition, find that, and
        # set other partition as unused partition!
        return {
            b"2": RootPartitions.THREE.value,
            b"3": RootPartitions.TWO.value,
            # if output is empty, current part is 2, set unused to 3!
            b"": RootPartitions.THREE.value,
        }[which]

    def switch_partition(self) -> Partition:
        unused_partition = self.find_unused_partition(self.used_partition())
        if unused_partition.number == 2:
            subprocess.run(["fw_setenv", "root_part", "2"])
        else:
            subprocess.run(["fw_setenv", "root_part", "3"])
        return {
            2: RootPartitions.TWO.value,
            3: RootPartitions.THREE.value,
        }[unused_partition.number]

    def resize_partition(self, path: str) -> bool:
        # resize part now!
        if subprocess.run(["resize2fs", path]).returncode == 0:
            return True
        else:
            return False

    def mountpoint_root(self) -> str:
        """provides mountpoint location for :py:meth:`mount_update`.

        exists only for ease of mocking
        """
        return "/mnt"

    @staticmethod
    def get_partition_size(path: str) -> int:
        """Gets the size of the given partition in bytes."""
        return int(
            subprocess.check_output(["blockdev", "--getsize64", path]).decode().strip()
        )


class RootFSInterface:
    """RootFS interface class."""

    def write_update(
        self,
        rootfs_filepath: str,
        part: Partition,
        progress_callback: Callable[[float], None],
        chunk_size: int = 1024,
    ) -> Tuple[bool, str]:
        total_size = 0
        written_size = 0
        try:
            # the double pass here is
            # temporary until we have
            # xz size decoding working
            with lzma.open(rootfs_filepath, "rb") as fsrc:
                while True:
                    chunk = fsrc.read(chunk_size)
                    total_size += len(chunk)
                    if len(chunk) != chunk_size:
                        break

            # check that the uncompressed size is greater than the partition size
            partition_size = PartitionManager.get_partition_size(part.path)
            if total_size >= partition_size:
                msg = f"Write failed, update size ({total_size}) is larger than partition size {part.path} ({partition_size})."
                LOG.error(msg)
                return False, msg

            with lzma.open(rootfs_filepath, "rb") as fsrc, open(
                part.path, "wb"
            ) as fdst:
                while True:
                    chunk = fsrc.read(chunk_size)
                    fdst.write(chunk)
                    written_size += chunk_size
                    progress_callback(written_size / total_size)
                    if len(chunk) != chunk_size:
                        break
            return True, ""
        except Exception:
            LOG.exception("RootFSInterface::write_update exception reading")
            return False, "Unknown error"


class OT3UpdateActions(UpdateActionsInterface):
    """OE updater class."""

    def __init__(self, root_FS_intf: RootFSInterface, part_mngr: PartitionManager):
        self.root_FS_intf = root_FS_intf
        self.part_mngr = part_mngr

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
        if filename not in UPDATE_PKG_OE:
            msg = f"invalid filename {filepath} {filename}"
            LOG.error(msg)
            raise InvalidPKGName(msg)

        def zip_callback(progress: Any) -> None:
            progress_callback(progress / 2.0)

        required = [ROOTFS_NAME, ROOTFS_HASH_NAME]
        if cert_path:
            required.append(ROOTFS_SIG_NAME)
        files, sizes = unzip_update(filepath, zip_callback, UPDATE_FILES, required)

        def hash_callback(progress: Any) -> None:
            progress_callback(progress / 2.0 + 0.5)

        version_file = str(files.get("VERSION.json"))
        version_dict = load_version_file(version_file)
        robot_type = version_dict.get("robot_type")
        if robot_type != MODEL_OT3:
            msg = f"Invalid robot_type: expected {MODEL_OT3} != packaged {robot_type}"
            LOG.error(msg)
            raise InvalidRobotType(msg)

        rootfs = files.get(ROOTFS_NAME)
        assert rootfs
        rootfs_hash = hash_file(rootfs, hash_callback, file_size=sizes[ROOTFS_NAME])
        hashfile = files.get(ROOTFS_HASH_NAME)
        assert hashfile
        packaged_hash = b""
        with open(hashfile, "rb") as fh:
            packaged_hash = fh.readline().strip()
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

    def commit_update(self) -> None:
        """Switch the target boot partition."""
        unused = self.part_mngr.find_unused_partition(self.part_mngr.used_partition())
        new = self.part_mngr.switch_partition()
        if new != unused:
            msg = f"Bad switch: switched to {new} when {unused} was unused"
            LOG.error(msg)
            raise RuntimeError(msg)
        else:
            self.part_mngr.mount_fs(new.path, new.mount_point)
            self.part_mngr.resize_partition(new.path)

            LOG.info(f"commit_update: committed to booting {new}")

    @contextlib.contextmanager
    def mount_update(self) -> Generator[str, None, None]:
        """Mount the freshly-written partition r/w (to update machine-id).

        Should be used as a context manager, and the yielded value is the path
        to the mount. When the context manager exits, the partition will be
        unmounted again and its mountpoint removed.

        :param mountpoint_in: The directory in which to create the mountpoint.
        """
        unused = self.part_mngr.find_unused_partition(self.part_mngr.used_partition())
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
        mid = open(os.path.join(current_root, "etc", "machine-id")).read()
        with open(os.path.join(new_root, "etc", "machine-id"), "w") as new_mid:
            new_mid.write(mid)
        LOG.info(f"Wrote machine_id {mid.strip()} to {new_root}/etc/machine-id")

    def write_update(
        self,
        rootfs_filepath: str,
        progress_callback: Callable[[float], None],
        chunk_size: int = 1024,
        file_size: Optional[int] = None,
    ) -> Partition:
        self.decomp_and_write(rootfs_filepath, progress_callback)
        unused_partition = self.part_mngr.find_unused_partition(
            self.part_mngr.used_partition()
        )
        return unused_partition

    def decomp_and_write(
        self, downloaded_update_path: str, progress_callback: Callable[[float], None]
    ) -> None:
        """Decompress and write update to partition

        Function expects the update file to be a .xz compressed file

        """

        unused_partition = self.part_mngr.find_unused_partition(
            self.part_mngr.used_partition()
        )
        self.part_mngr.umount_fs(unused_partition.path)
        success, msg = self.root_FS_intf.write_update(
            downloaded_update_path, unused_partition, progress_callback
        )
        if not success:
            raise RuntimeError(msg)

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
