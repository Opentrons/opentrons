from . import execute_v1, execute_v3
from opentrons.protocol_api.execute import (
    get_protocol_schema_version, validate_protocol)


def execute_protocol(protocol_json):
    protocol_version = get_protocol_schema_version(protocol_json)
    if protocol_version > 3:
        raise RuntimeError(
            f'JSON Protocol version {protocol_version} is not yet ' +
            'supported in this version of the API')

    validate_protocol(protocol_json)

    if protocol_version == 3:
        ins = execute_v3.load_pipettes(
            protocol_json)
        lw = execute_v3.load_labware(
            protocol_json)
        execute_v3.dispatch_commands(protocol_json, ins, lw)
    else:
        ins = execute_v1.load_pipettes(
            protocol_json)
        lw = execute_v1.load_labware(
            protocol_json)
        execute_v1.dispatch_commands(protocol_json, ins, lw)

    return {
        'pipettes': ins,
        'labware': lw
    }
