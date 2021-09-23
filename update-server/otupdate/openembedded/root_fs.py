import argparse
import sys
import json
import logging
import subprocess
from aiohttp import web
from dataclasses import dataclass

LOG = logging.getLogger(__name__)
# just nest this into RootFSConfigParser class.


@dataclass
class RootFSInfo:
    major: int
    minor: int
    disk: str

    def init(self):
        self.major = None
        self.minor = None
        self.disk = ''

    def __str__(self):
        try:
            if (None is not self.major and None is not self.minor):
                return (str)(str(self.disk)+str(self.major)+str(self.minor))
            else:
                raise TypeError
        except TypeError:
            LOG.exception('disk not found')


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
                try:
                    f = open('root_fs_config.json')
                except OSError:
                    ("Could not open/read root_fs_config.json")
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
                    LOG.warning("Could not open/create root_fs_config.json")
                    sys.exit()
                with f:
                    json.dump(root_FS_config, f)

    def __init__(self):
        self._root_FS_config = self.RootFSConfig()
        self._root_FS_config_parser = self._root_FS_config._root_FS_config_parser
        LOG.debug('check parser init \n')
        tmp = self._root_FS_config_parser.config
        tmp = tmp['data']['defaults']['ROOT_FS_PARTITION']
        LOG.debug(tmp)
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
        # print(self.print_rootFS_partition(arg))
        print(self.print_rootFS_config(arg))
