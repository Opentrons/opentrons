""" Functions for executing protocols targeting v1
"""
from . import execute_v3
from opentrons.protocols.types import JsonProtocol


def execute_protocol(protocol: JsonProtocol):
    if protocol.schema_version == 3:
        ins = execute_v3.load_pipettes(protocol.contents)
        lw = execute_v3.load_labware(protocol.contents)
        execute_v3.dispatch_commands(protocol.contents, ins, lw)

    return {
        'pipettes': ins,
        'labware': lw
    }
