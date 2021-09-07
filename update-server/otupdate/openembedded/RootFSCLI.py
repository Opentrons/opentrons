"""

CLI for RootFS
"""

import argparse

from . import RootFS


class RootFSCLI:
    def parse_args(self, args):
        rfs = RootFS.RootFS()
        parser = argparse.ArgumentParser(description='Change OT3 RootFS partition'
                                                     'to upgrade fs.')
        subparsers = parser.add_subparsers()
        # create Debug subcommand
        parser_debug = subparsers.add_parser('debug', help='Debug')
        parser_debug.add_argument('-p', '--port', dest='port', type=int,
                            help='Port to listen on. Passed to aiohttp')
        parser_debug.add_argument('--host', dest='host', type=str, default='127.0.0.1',
                            help='Host to listen on. Passed to aiohttp')
        parser_debug.add_argument('--version-file', dest='version_file',
                            type=str, default='IGNORE',
                            help='Version file path if not default')
        parser_debug.add_argument('--log-level', dest='log_level',
                            choices=['debug', 'info', 'warning', 'error'],
                            help='Log level', default='info')
        parser_debug.add_argument('--config-file', dest='config_file',
                            type=str, default=None,
                            help='Config file path.')
        parser_debug.add_argument('--tt', '-t', type=str, nargs='?', help="test title",
                                  default="OT3 RootFS Test", const="OT# RootFS Test")
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
        parser_factoryRestore.set_defaults(func=rfs.factory_restore)
        parser_swapPartition = subparsers.add_parser('swap', help='Swap '
                                                                  'RootFS partitions')
        parser_swapPartition.add_argument('--bco', '-b', type=str,
                                          help='bootsrc carve '
                                               'out bootargs get appended to')
        parser_swapPartition.add_argument('--part1', '-1',
                                          type=str, help="file system "
                                                         "partition 1")
        parser_swapPartition.add_argument('--part2', '-2',
                                          type=str, help="file system partition 2")
        parser_swapPartition.set_defaults(func=rfs.swap_partition)
        options = parser.parse_args(args)
        return options
