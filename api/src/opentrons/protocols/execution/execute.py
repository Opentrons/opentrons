import logging

from opentrons.protocol_api import ProtocolContext
from opentrons.protocols.execution.execute_python import run_python
from opentrons.protocols.execution.json_dispatchers import (
    pipette_command_map,
    temperature_module_command_map,
    magnetic_module_command_map,
    thermocycler_module_command_map,
)
from opentrons.protocols.execution import execute_json_v4, execute_json_v3

from opentrons.protocols.types import PythonProtocol, Protocol
from opentrons.protocols.api_support.types import APIVersion

MODULE_LOG = logging.getLogger(__name__)


def run_protocol(protocol: Protocol, context: ProtocolContext):
    """Run a protocol.

    :param protocol: The :py:class:`.protocols.types.Protocol` to execute
    :param context: The context to use.
    """
    if isinstance(protocol, PythonProtocol):
        if protocol.api_level >= APIVersion(2, 0):
            run_python(protocol, context)
        else:
            raise RuntimeError(f"Unsupported python API version: {protocol.api_level}")
    else:
        if protocol.contents["schemaVersion"] == 3:
            ins = execute_json_v3.load_pipettes_from_json(context, protocol.contents)
            lw = execute_json_v3.load_labware_from_json_defs(context, protocol.contents)
            execute_json_v3.dispatch_json(context, protocol.contents, ins, lw)
        elif protocol.contents["schemaVersion"] in [4, 5]:
            # reuse the v3 fns for loading labware and pipettes
            # b/c the v4 protocol has no changes for these keys
            ins = execute_json_v3.load_pipettes_from_json(context, protocol.contents)

            modules = execute_json_v4.load_modules_from_json(context, protocol.contents)

            lw = execute_json_v4.load_labware_from_json_defs(
                context, protocol.contents, modules
            )
            execute_json_v4.dispatch_json(
                context,
                protocol.contents,
                ins,
                lw,
                modules,
                pipette_command_map,
                magnetic_module_command_map,
                temperature_module_command_map,
                thermocycler_module_command_map,
            )
        else:
            raise RuntimeError(
                f"Unsupported JSON protocol schema: {protocol.schema_version}"
            )
