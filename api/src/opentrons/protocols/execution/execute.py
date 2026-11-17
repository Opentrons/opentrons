import logging
from typing import Optional

from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api._parameters import Parameters
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.execution.execute_python import exec_run
from opentrons.protocols.parameters.csv_parameter_interface import CSVParameter
from opentrons.protocols.types import PythonProtocol

MODULE_LOG = logging.getLogger(__name__)


def run_protocol(
    protocol: PythonProtocol,
    context: ProtocolContext,
    run_time_parameters_with_overrides: Optional[Parameters] = None,
) -> None:
    """Run a Python protocol.

    :param protocol: The :py:class:`.protocols.types.Protocol` to execute
    :param context: The protocol context to use.
    :param run_time_parameters_with_overrides: Run time parameters defined in the protocol,
        updated with the run's RTP override values. When we are running either simulate
        or execute, this will be None (until RTP is supported in cli commands)
    """
    try:
        if protocol.api_level >= APIVersion(2, 0):
            exec_run(
                proto=protocol,
                context=context,
                run_time_parameters_with_overrides=run_time_parameters_with_overrides,
            )
        else:
            raise RuntimeError(f"Unsupported python API version: {protocol.api_level}")
    except Exception:
        raise
    finally:
        if protocol.api_level >= APIVersion(2, 18):
            for parameter in context.params.get_all().values():
                if isinstance(parameter, CSVParameter) and parameter.file_opened:
                    parameter.file.close()
