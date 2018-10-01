""" Run a protocol locally to test it before sending it to an OT2
"""
import argparse
import opentrons.protocol_api as protocol_api


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('protocol', metavar='PROTOCOL',
                        type=argparse.FileType('rb'),
                        help='The python protocol file to run')
    args = parser.parse_args()
    protocol_api.run(protocol_bytes=args.protocol.read(),
                     simulate=True)
