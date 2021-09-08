import argparse
import os
import re
import sys
import json
import shlex
import stat
import subprocess
from aiohttp import web
from dataclasses import dataclass

# just nest this into RootFSConfigParser class.
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
        """ CONFIG vars, read in from config files """
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
                self.reset_config_file()
                try:
                    f = open('root_fs_config.json')
                except OSError:
                    print("Could not open/read root_fs_config.json")
                    sys.exit()
                with f:
                    self.config = json.load(f)

            @staticmethod
            def reset_config_file():
                root_FS_config = {
                        "data" : {
                            "defaults": {

                                "ROOTFS_PART1" : '',
                                "ROOTFS_PART2" : '',
                                "BMAP_IMAGE":  '',
                                "BMAP_FILE": '',
                                "DISK": 'mmcblk0',
                                "BOOT_SRC_CARVE_OUT":  '',
                                "ROOT_FS_PARTITION": '2',
                                "SD_CARD_MOUNT_POINT": '/media/mmcblk1p1',
                                },
                            "currrent_root_FS": {
                                "root_part" :  2
                                }
                            }
                        }
                try:
                    f = open('root_fs_config.json', 'w+')
                except OSError:
                    print("Could not open/create root_fs_config.json")
                    sys.exit()
                with f:
                    json.dump(root_FS_config, f)

    def __init__(self):
        self._root_FS_config = self.RootFSConfig()
        self._root_FS_config_parser = self._root_FS_config._root_FS_config_parser
        print('check this \n')
        tmp = self._root_FS_config_parser.config
        tmp = tmp['data']['defaults']['ROOT_FS_PARTITION']
        print(tmp)
        self._root_FS_config.ROOT_FS_PARTITION = tmp

    def set_partition(self, arg: argparse.Namespace, partition_name: str) -> None:
        """ Run boot util command here to set partion
         Use the libubootenv utility to set bootargs
         boot.src has a carveout for bootargs, use that """
        self._root_FS_config.BOOT_SRC_CARVE_OUT = arg.bco

        subprocess.run(["fw_setenv", self._root_FS_config.BOOT_SRC_CARVE_OUT,
                        partition_name])

    async def get_partition_api(self, request: web.Request) -> web.Response:
        return web.Response(text="hello, world")

    def get_partition_api_(self) -> web.Response:
        print('hello api')
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
            return web.json_response(
                    data={'major': f'major {ri.major}',
                          'minor': ri.minor},
                    status=200)
        else:
            raise AssertionError("Unexpected value of partition")

    def get_partition(self) -> RootFSInfo:
        print('hello')
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
        tmp = ('Current RootFS Partition '+tmp.disk+'\n')
        return tmp

    def print_rootFS_config(self, arg: argparse.Namespace) -> str:
        tmp = (('ROOTFS_TEST_TITLE '+arg.tt+'\n') +
               ('ROOTFS_PART1 '+self._root_FS_config.ROOTFS_PART1+'\n') +
               ('ROOTFS_PART2 '+self._root_FS_config.ROOTFS_PART2+'\n') +
               ('BMAP_IMAGE '+self._root_FS_config.BMAP_IMAGE+'\n') +
               ('BMAP_FILE '+self._root_FS_config.BMAP_FILE+'\n') +
               ('DISK '+self._root_FS_config.DISK+'\n') +
               ('BOOT_SRC_CARVE_OUT '+self._root_FS_config.BOOT_SRC_CARVE_OUT+'\n') +
               ('ROOT_FS_PARTITION '+self._root_FS_config.ROOT_FS_PARTITION+'\n') +
               ('SD_CARD_MOUNT_POINT '+self._root_FS_config.SD_CARD_MOUNT_POINT+'\n')
               )
        return tmp

    def debug(self, arg: argparse.Namespace) -> None:
        print(self.print_rootFS_partition(arg))
        print(self.print_rootFS_config(arg))
