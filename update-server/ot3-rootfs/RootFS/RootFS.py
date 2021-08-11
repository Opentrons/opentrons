import argparse, os, stat, subprocess, shlex, re, sys
from dataclasses import dataclass

""" CONFIG vars, can be changed through the commandline arguments """
ROOTFS_PART1 = ''
ROOTFS_PART2 = ''
BMAP_IMAGE = ''
BMAP_FILE = ''
DISK = 'mmcblk0'
BOOT_SRC_CARVE_OUT = ''
ROOT_FS_PARTITION = ''
SD_CARD_MOUNT_POINT = '/media/mmcblk1p1'
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
    def setPartition(self, partitionName):
        """ Run boot util command here to set partion
         Use the libubootenv utility to set bootargs
         boot.src has a carveout for bootargs, use that """
        subprocess.run(["fw_setenv",BOOT_SRC_CARVE_OUT,"boot="+PartitionName ])

    def getPartition(self):
        """ print partition name"""
        dev=os.stat('/')[stat.ST_DEV]
        major=os.major(dev)
        minor=os.minor(dev)
        out = subprocess.Popen(shlex.split("df /"), stdout=subprocess.PIPE).communicate()
        m = re.search(r'(/[^\s]+)s',str(out))
        if m:
            mp = m.group(1)
            ri = RootFSInfo(major,minor,mp)
            return ri
        else:
            return None

    def swapPartition(self):
        """swap partitions get current partition and swap it with the other available partition"""
        currentPartition = getPartition()
        if currentPartition is not None:
            if currentPartition.disk == ROOTFS_PART1:
                setPartition(ROOTFS_PART2)
            else:
                setPartition(ROOTFS_PART1)

    def factoryRestore(self,arg):
        """" bmap to factory reset here"""
        subprocess.run(["bmaptool", "copy", "--bmap", SD_CARD_MOUNT_POINT+BMAP_FILE, "--no-sig-verify", "--no-verify", SD_CARD_MOUNT_POINT+BMAP_IMAGE, DISK])

    """ debug fuctions """
    def printRootFSPartition(self,arg):
        tmp=self.getPartition()
        print ('Current RootFS Partition '+tmp.disk+'\n')
    def printRootFSConfig(self, arg):
        print ('ROOTFS_TEST_TITLE '+arg.tt+'\n')
        print ('ROOTFS_PART1 '+RootFS.ROOTFS_PART1+'\n')
        print ('ROOTFS_PART2 '+RootFS.ROOTFS_PART2+'\n')
        print ('BMAP_IMAGE '+RootFS.BMAP_IMAGE+'\n')
        print ('BMAP_FILE '+RootFS.BMAP_FILE+'\n')
        print ('DISK '+RootFS.DISK+'\n')
        print ('BOOT_SRC_CARVE_OUT '+RootFS.BOOT_SRC_CARVE_OUT+'\n')
        print ('ROOT_FS_PARTITION '+RootFS.ROOT_FS_PARTITION+'\n')
        print ('SD_CARD_MOUNT_POINT '+RootFS.SD_CARD_MOUNT_POINT+'\n')
    def debug(self, arg):
     self.printRootFSPartition(arg)
     self.printRootFSConfig(arg)
    def __init__(self):
        self.RootFSPartition = ROOT_FS_PARTITION

def test():
    print('test me')

def main():
    rfs = RootFS()
    parser = argparse.ArgumentParser(description='Change OT3 RootFS partition to upgrade fs.')
    subparsers = parser.add_subparsers()
    # create Debug subcommand
    parser_debug = subparsers.add_parser('debug', help = 'Debug')
    parser_debug.add_argument('--tt', '-t', type=str, nargs='?', help="test title", default="OT3 RootFS Test", const="OT# RootFS Test")

    parser_debug.set_defaults(func=rfs.debug)
    # create Restore subcommand
    parser_factoryRestore = subparsers.add_parser('restore', help = 'Restore')
    parser_factoryRestore.add_argument('--wbm', '-b', nargs='?', const='opentrons-ot3-image-verdin-imx8mm.wic.bmap', default='opentrons-ot3-image-verdin-imx8mm.wic.bmap', type=str, help="wic bmap file")
    parser_factoryRestore.add_argument('--wi', '-i', nargs='?', const='opentrons-ot3-image-verdin-imx8mm.wic.gz', default='opentrons-ot3-image-verdin-imx8mm.wic.gz', type=str, help="wic image file")

    parser_factoryRestore.set_defaults(func=rfs.factoryRestore)
    parser_swapPartition = subparsers.add_parser('swap', help = 'Swap RootFS partitions')
    parser_swapPartition.add_argument('--bco', '-b', type=str, help="bootsrc carve out bootargs get appended to")
    parser_swapPartition.add_argument('--part1', '-1', type=str, help="file system partition 1")
    parser_swapPartition.add_argument('--part2', '-2', type=str, help="file system partition 2")

    parser_swapPartition.set_defaults(func=rfs.swapPartition)
    options = parser.parse_args()
    options.func(options)
if __name__ == "__main__":
    main()
