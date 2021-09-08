"""
Entrypoint for the openembedded update server
"""
import sys

from . import oe_server_mode


def main():
    oesm = oe_server_mode.OEServerMode()
    options = oesm.parse_args(sys.argv[1:])
    options.func(options)


if __name__ == "__main__":
    main()
