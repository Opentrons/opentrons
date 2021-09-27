import argparse
import sys
from otupdate.openembedded_server.__main__ import main as oe_main
from otupdate.buildroot.__main__ import main as br_main


def parse_args():
    parser = argparse.ArgumentParser(description='run oe/br'
                                                 'update server')
    subparser = parser.add_subparsers(dest='build_system')
    oe = subparser.add_parser('oe')
    oe.set_defaults(func=oe_main)
    args = parser.parse_args()
    if args.build_system == 'oe':
        """ git rid of oe from command line args,
        preserve order of other server args
        """
        sys.argv[1:] = sys.argv[2:]
        oe_main()
    else:
        # assuming python -m otupdate used  
        br_main()


parse_args()
# oe_main()
