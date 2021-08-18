import os
import re
import shlex
import stat
import subprocess
from dataclasses import dataclass


@dataclass
class RootFSInfo:
    major: str
    minor: str
    disk: str


""" A simple class for OT3 RootFS manipulation
 ** Get current partition RootFS is mounted on
 ** Swap RootFS partition
 ** Factory reset OT3 using bmap image on SD-Card """


class RootFS:
    """ CONFIG vars, can be changed through the commandline arguments """
    ROOTFS_PART1 = ''
    ROOTFS_PART2 = ''
    BMAP_IMAGE = ''
    BMAP_FILE = ''
    DISK = 'mmcblk0'
    BOOT_SRC_CARVE_OUT = ''
    ROOT_FS_PARTITION = ''
    SD_CARD_MOUNT_POINT = '/media/mmcblk1p1'

    def set_partition(self, arg, PartitionName):
        """ Run boot util command here to set partion
         Use the libubootenv utility to set bootargs
         boot.src has a carveout for bootargs, use that """
        BOOT_SRC_CARVE_OUT = arg.bco

        subprocess.run(["fw_setenv", BOOT_SRC_CARVE_OUT, "boot="+PartitionName])

    def get_partition(self):
        """ print partition name"""
        dev = os.stat('/')[stat.ST_DEV]
        major = os.major(dev)
        minor = os.minor(dev)
        out = subprocess.Popen(shlex.split("df /"),
                               stdout=subprocess.PIPE).communicate()
        m = re.search(r'(/[^\s]+)s', str(out))
        if m:
            mp = m.group(1)
            ri = RootFSInfo(major, minor, mp)
            return ri
        else:
            return None

    def swap_partition(self, arg):
        """swap partitions get current partition
           and swap it with the other available partition"""
        currentPartition = self.get_partition()
        if currentPartition is not None:
            if currentPartition.disk == RootFS.ROOTFS_PART1:
                self.set_partition(arg, RootFS.ROOTFS_PART2)
            else:
                self.set_partition(arg, RootFS.ROOTFS_PART1)

    def factory_restore(self, arg):
        """" bmap to factory reset here"""
        subprocess.run(["bmaptool", "copy", "--bmap",
                        RootFS.SD_CARD_MOUNT_POINT+RootFS.BMAP_FILE,
                        "--no-sig-verify", "--no-verify",
                        RootFS.SD_CARD_MOUNT_POINT+RootFS.BMAP_IMAGE, RootFS.DISK])

    """ debug fuctions """
    def print_rootFS_partition(self, arg):
        tmp = self.get_partition()
        print('Current RootFS Partition '+tmp.disk+'\n')

    def print_rootFS_config(self, arg):
        print('ROOTFS_TEST_TITLE '+arg.tt+'\n')
        print('ROOTFS_PART1 '+RootFS.ROOTFS_PART1+'\n')
        print('ROOTFS_PART2 '+RootFS.ROOTFS_PART2+'\n')
        print('BMAP_IMAGE '+RootFS.BMAP_IMAGE+'\n')
        print('BMAP_FILE '+RootFS.BMAP_FILE+'\n')
        print('DISK '+RootFS.DISK+'\n')
        print('BOOT_SRC_CARVE_OUT '+RootFS.BOOT_SRC_CARVE_OUT+'\n')
        print('ROOT_FS_PARTITION '+RootFS.ROOT_FS_PARTITION+'\n')
        print('SD_CARD_MOUNT_POINT '+RootFS.SD_CARD_MOUNT_POINT+'\n')

    def debug(self, arg):
        self.print_rootFS_partition(arg)
        self.print_rootFS_config(arg)
