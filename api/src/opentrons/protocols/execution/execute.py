import logging
from typing import Optional

from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.protocol_engine.types import RunTimeParamValuesType
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


def run_protocol(
    protocol: Protocol,
    context: ProtocolContext,
    parameter_context: Optional[ParameterContext] = None,
    run_time_param_overrides: Optional[RunTimeParamValuesType] = None,
) -> None:
    """Run a protocol.

    :param protocol: The :py:class:`.protocols.types.Protocol` to execute
    :param context: The protocol context to use.
    :param parameter_context: The parameter context to use.
    :param run_time_param_overrides: Any parameter values that are potentially overriding the defaults
    """
    if isinstance(protocol, PythonProtocol):
        if protocol.api_level >= APIVersion(2, 0):
            # If this is None here then we're either running simulate or execute, in any case we don't need to report
            # this in analysis which is the reason we'd pass it to this function
            if parameter_context is None:
                parameter_context = ParameterContext(protocol.api_level)
            run_python(
                proto=protocol,
                context=context,
                parameter_context=parameter_context,
                run_time_param_overrides=run_time_param_overrides,
            )
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
