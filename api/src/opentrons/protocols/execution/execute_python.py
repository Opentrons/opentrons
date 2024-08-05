import asyncio
import inspect
import logging
import traceback
import sys
from typing import Any, Dict, Optional

from opentrons.drivers.smoothie_drivers.errors import SmoothieAlarm
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.protocol_api._parameters import Parameters
from opentrons.protocols.execution.errors import ExceptionInProtocolError
from opentrons.protocols.types import PythonProtocol, MalformedPythonProtocolError
from opentrons.protocol_engine.types import (
    PrimitiveRunTimeParamValuesType,
    CSVRuntimeParamPaths,
)


from opentrons_shared_data.errors.exceptions import ExecutionCancelledError

MODULE_LOG = logging.getLogger(__name__)


def _runfunc_ok(run_func: Any):
    if not callable(run_func):
        raise SyntaxError("No function 'run(ctx)' defined")
    sig = inspect.Signature.from_callable(run_func)
    if not sig.parameters:
        raise SyntaxError("Function 'run()' does not take any parameters")
    if len(sig.parameters) > 1:
        for name, param in list(sig.parameters.items())[1:]:
            if param.default == inspect.Parameter.empty:
                raise SyntaxError(
                    "Function 'run{}' must be called with more than one "
                    "argument but would be called as 'run(ctx)'".format(str(sig))
                )


def _add_parameters_func_ok(add_parameters_func: Any) -> None:
    if not callable(add_parameters_func):
        raise SyntaxError("'add_parameters' must be a function.")
    sig = inspect.Signature.from_callable(add_parameters_func)
    if len(sig.parameters) != 1:
        raise SyntaxError("Function 'add_parameters' must take exactly one argument.")


def _find_protocol_error(tb, proto_name):
    """Return the FrameInfo for the lowest frame in the traceback from the
    protocol.
    """
    tb_info = traceback.extract_tb(tb)
    for frame in reversed(tb_info):
        if frame.filename == proto_name:
            return frame
    else:
        raise KeyError


def _raise_pretty_protocol_error(exception: Exception, filename: str) -> None:
    exc_type, exc_value, tb = sys.exc_info()
    try:
        frame = _find_protocol_error(tb, filename)
    except KeyError:
        # No pretty names, just raise it
        raise exception
    raise ExceptionInProtocolError(
        exception, tb, str(exception), frame.lineno
    ) from exception


def _parse_and_set_parameters(
    parameter_context: ParameterContext,
    run_time_param_overrides: Optional[PrimitiveRunTimeParamValuesType],
    run_time_param_file_overrides: Optional[CSVRuntimeParamPaths],
    new_globs: Dict[Any, Any],
    filename: str,
) -> Parameters:
    try:
        _add_parameters_func_ok(new_globs.get("add_parameters"))
    except SyntaxError as se:
        raise MalformedPythonProtocolError(str(se))
    new_globs["__param_context"] = parameter_context
    try:
        exec("add_parameters(__param_context)", new_globs)
        if run_time_param_overrides is not None:
            parameter_context.set_parameters(run_time_param_overrides)
        if run_time_param_file_overrides is not None:
            parameter_context.initialize_csv_files(run_time_param_file_overrides)
    except Exception as e:
        _raise_pretty_protocol_error(exception=e, filename=filename)
    return parameter_context.export_parameters_for_protocol()


def _get_filename(
    protocol: PythonProtocol,
) -> str:
    # TODO(mm, 2023-10-11): This coupling to opentrons.protocols.parse is fragile.
    # Can we get the correct filename directly from proto.contents?
    if protocol.filename and protocol.filename.endswith("zip"):
        # The ".zip" extension needs to match what opentrons.protocols.parse recognizes as a bundle,
        # and the "protocol.ot2.py" fallback needs to match what opentrons.protocol.py sets as the
        # AST filename.
        return "protocol.ot2.py"
    else:
        # "<protocol>" needs to match what opentrons.protocols.parse sets as the fallback
        # AST filename.
        return protocol.filename or "<protocol>"


def exec_add_parameters(
    protocol: PythonProtocol,
    parameter_context: ParameterContext,
    run_time_param_overrides: Optional[PrimitiveRunTimeParamValuesType],
    run_time_param_file_overrides: Optional[CSVRuntimeParamPaths],
) -> Optional[Parameters]:
    """Exec the add_parameters function and get the final run time parameters with overrides."""
    new_globs: Dict[Any, Any] = {}
    exec(protocol.contents, new_globs)
    filename = _get_filename(protocol)

    return (
        _parse_and_set_parameters(
            parameter_context=parameter_context,
            run_time_param_overrides=run_time_param_overrides,
            run_time_param_file_overrides=run_time_param_file_overrides,
            new_globs=new_globs,
            filename=filename,
        )
        if new_globs.get("add_parameters")
        else None
    )


def exec_run(
    proto: PythonProtocol,
    context: ProtocolContext,
    run_time_parameters_with_overrides: Optional[Parameters] = None,
) -> None:
    new_globs: Dict[Any, Any] = {}
    exec(proto.contents, new_globs)
    # If the protocol is written correctly, it will have defined a function
    # like run(context: ProtocolContext). If so, that function is now in the
    # current scope.
    filename = _get_filename(proto)
    if run_time_parameters_with_overrides:
        context._params = run_time_parameters_with_overrides

    try:
        _runfunc_ok(new_globs.get("run"))
    except SyntaxError as se:
        raise MalformedPythonProtocolError(str(se))

    new_globs["__context"] = context
    try:
        exec("run(__context)", new_globs)
    except (
        SmoothieAlarm,
        asyncio.CancelledError,
        ExecutionCancelledError,
    ):
        # this is a protocol cancel and shouldn't have special logging
        raise
    except Exception as e:
        _raise_pretty_protocol_error(exception=e, filename=filename)
