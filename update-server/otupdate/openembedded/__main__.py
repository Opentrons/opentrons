"""
Entrypoint for the buildroot update server
"""
import argparse

from . import (RootFS)


def main():
    rfs = RootFS()
    parser = argparse.ArgumentParser(description='Change OT3 RootFS partition'
                                                 'to upgrade fs.')
    subparsers = parser.add_subparsers()
    # create Debug subcommand
    parser_debug = subparsers.add_parser('debug', help='Debug')
    parser_debug.add_argument('--tt', '-t', type=str, nargs='?', help="test title",
                              default="OT3 RootFS Test",
                              const="OT# RootFS Test")

    parser_debug.set_defaults(func=rfs.debug)
    # create Restore subcommand
    parser_factoryRestore = subparsers.add_parser('restore', help='Restore')
    parser_factoryRestore.add_argument('--wbm', '-b', nargs='?',
                                       const='opentrons-ot3-image'
                                             '-verdin-imx8mm.wic.bmap',
                                       default='opentrons-ot3-'
                                               'image-verdin-imx8mm.wic.bmap',
                                       type=str, help="wic bmap file")
    parser_factoryRestore.add_argument('--wi', '-i', nargs='?',
                                       const='opentrons-ot3-image'
                                       '-verdin-imx8mm.wic.gz',
                                       default='opentrons-ot3'
                                               '-image-verdin-imx8mm.wic.gz',
                                       type=str, help="wic image file")

    parser_factoryRestore.set_defaults(func=rfs.factoryRestore)
    parser_swapPartition = subparsers.add_parser('swap', help='Swap RootFS partitions')
    parser_swapPartition.add_argument('--bco', '-b', type=str,
                                      help="bootsrc carve out bootargs get appended to")
    parser_swapPartition.add_argument('--part1', '-1',
                                      type=str, help="file system "
                                                     "partition 1")
    parser_swapPartition.add_argument('--part2', '-2',
                                      type=str, help="file system partition 2")

    parser_swapPartition.set_defaults(func=rfs.swapPartition)
    options = parser.parse_args()
    options.func(options)


if __name__ == "__main__":
    main()
