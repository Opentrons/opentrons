"""
Entrypoint for the openembedded update server
"""
import sys

from . import RootFSCLI


def main():
    rfscli = RootFSCLI.RootFSCLI()
    options = rfscli.parse_args(sys.argv[1:])
    options.func(options)


if __name__ == "__main__":
    main()
