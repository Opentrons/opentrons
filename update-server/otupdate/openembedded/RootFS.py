import argparse
import configparser
import os
import re
import shlex
import stat
import subprocess
from dataclasses import dataclass


@dataclass
class RootFSInfo:
    major: int
    minor: int
    disk: str


""" A simple class for OT3 RootFS manipulation
 ** Get current partition RootFS is mounted on
 ** Swap RootFS partition
 ** Factory reset OT3 using bmap image on SD-Card """


class RootFS:

    @dataclass
    class RootFSConfig:
        """ CONFIG vars, can be changed through the commandline arguments """
        ROOTFS_PART1: str = ''
        ROOTFS_PART2: str = ''
        BMAP_IMAGE: str = ''
        BMAP_FILE: str = ''
        DISK: str = 'mmcblk0'
        BOOT_SRC_CARVE_OUT: str = ''
        ROOT_FS_PARTITION: str = ''
        SD_CARD_MOUNT_POINT: str = '/media/mmcblk1p1'

        def __init__(self):
            self._root_FS_config_parser = self.RootFSConfigParser()

        class RootFSConfigParser:
            def __init__(self):
                self.config = configparser.ConfigParser()
                self.config.read('RootFS.ini')

    def __init__(self):
        self._root_FS_config = self.RootFSConfig()
        self._root_FS_config_parser = self._root_FS_config._root_FS_config_parser
        print('check this \n')
        print(self._root_FS_config_parser.config['DEFAULTS']['ROOT_FS_PARTITION'])
        tmp = self._root_FS_config_parser.config['DEFAULTS']['ROOT_FS_PARTITION']
        self._root_FS_config.ROOT_FS_PARTITION = tmp

    def set_partition(self, arg: argparse.Namespace, partition_name: str) -> None:
        """ Run boot util command here to set partion
         Use the libubootenv utility to set bootargs
         boot.src has a carveout for bootargs, use that """
        self._root_FS_config.BOOT_SRC_CARVE_OUT = arg.bco

        subprocess.run(["fw_setenv", self._root_FS_config.BOOT_SRC_CARVE_OUT,
                        partition_name])

    def get_partition(self) -> RootFSInfo:
        """ print partition name"""
        dev = os.stat('/')[stat.ST_DEV]
        major = os.major(dev)
        minor = os.minor(dev)
        out = subprocess.Popen(shlex.split("mount"),
                               stdout=subprocess.PIPE).communicate()
        m = re.search(r'(/[^\s]+)s', str(out))
        if m is not None:
            mp = m.group(1)
            ri = RootFSInfo(major, minor, mp)
            return ri
        else:
            raise AssertionError("Unexpected value of partition")

    def swap_partition(self, arg: argparse.Namespace) -> None:
        """swap partitions get current partition
           and swap it with the other available partition"""
        current_partition = self.get_partition()
        if current_partition is not None:
            if current_partition.disk == self._root_FS_config.ROOTFS_PART1:
                self.set_partition(arg, self._root_FS_config.ROOTFS_PART2)
            else:
                self.set_partition(arg, self._root_FS_config.ROOTFS_PART1)

    def factory_restore(self, arg: argparse.Namespace) -> None:
        """" bmap to factory reset here"""
        bmap = (self._root_FS_config.SD_CARD_MOUNT_POINT +
                self._root_FS_config.BMAP_FILE)
        bmap_img = (self._root_FS_config.SD_CARD_MOUNT_POINT +
                    self._root_FS_config.BMAP_IMAGE)
        subprocess.run(["bmaptool", "copy", "--bmap", bmap ,
                        "--no-sig-verify", "--no-verify",
                        bmap_img,
                        self._root_FS_config.DISK])

    """ debug fuctions """
    def print_rootFS_partition(self, arg: argparse.Namespace) -> str:
        tmp = self.get_partition()
        return ('Current RootFS Partition '+tmp.disk+'\n')

    def print_rootFS_config(self, arg: argparse.Namespace) -> str:
        return(('ROOTFS_TEST_TITLE '+arg.tt+'\n') +
               ('ROOTFS_PART1 '+self._root_FS_config.ROOTFS_PART1+'\n') +
               ('ROOTFS_PART2 '+self._root_FS_config.ROOTFS_PART2+'\n') +
               ('BMAP_IMAGE '+self._root_FS_config.BMAP_IMAGE+'\n') +
               ('BMAP_FILE '+self._root_FS_config.BMAP_FILE+'\n') +
               ('DISK '+self._root_FS_config.DISK+'\n') +
               ('BOOT_SRC_CARVE_OUT '+self._root_FS_config.BOOT_SRC_CARVE_OUT+'\n') +
               ('ROOT_FS_PARTITION '+self._root_FS_config.ROOT_FS_PARTITION+'\n') +
               ('SD_CARD_MOUNT_POINT '+self._root_FS_config.SD_CARD_MOUNT_POINT+'\n')
               )

    def debug(self, arg: argparse.Namespace) -> None:
        print(self.print_rootFS_partition(arg))
        print(self.print_rootFS_config(arg))
