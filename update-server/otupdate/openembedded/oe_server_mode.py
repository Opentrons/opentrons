"""

openembedded server modes. Allows us to start server in differeent modes.
For instance debug modes, just runs the debug functions and prints out
current config values.
Debug mode:
Gives us something to debug the api points, and whatever else additions
we might make to the server. Command line flag for debug mode has the
debug function associated with it.
Run mode:
Run mode can be what systemd service can use to run the server in (would have
a command line flag for it and a initialization function to go with it)

Command line arguments are used to run the server in these different modes
I'm just calling this class OEServerMode, and not a CLI. All config to be
done using root_fs_config.json, or additional json files if need be.
"""

import argparse

from . import root_fs


class OEServerMode:
    def parse_args(self, args):
        rfs = root_fs.RootFS()
        parser = argparse.ArgumentParser(description='Different modes'
                                                     'for the OE update server.')
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
