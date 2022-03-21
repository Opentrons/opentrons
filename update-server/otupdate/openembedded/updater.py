"""OE Updater and dependency injection classes."""
from otupdate.common.update_actions import UpdateActionsInterface, Partition
from typing import Callable, Optional
import enum
import subprocess

import logging

LOG = logging.getLogger(__name__)


class RootPartitions(enum.Enum):
    TWO: Partition = Partition(2, "/dev/mmcblk0p2")
    THREE: Partition = Partition(3, "/dev/mmcblk0p3")


class PartitionManager:
    """Partition manager class."""

    def find_unused_partition(self) -> RootPartitions:
        """Find unused partition"""
        # fw_printenv -n root_part gives the currently
        # active root_fs partition, find that, and
        # set other partition as unused partition!
        which = subprocess.check_output(["fw_printenv -n root_part"]).strip()
        return {
            b"2": RootPartitions.THREE,
            b"3": RootPartitions.TWO,
            # if output is empty, current part is 2, set unused to 3!
            b"": RootPartitions.THREE,
        }[which]


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

    def write_update(
        self,
        rootfs_filepath: str,
        progress_callback: Callable[[float], None],
        chunk_size: int,
        file_size: Optional[int],
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
        unused_partition = self.part_mngr.find_unused_partition().value
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
