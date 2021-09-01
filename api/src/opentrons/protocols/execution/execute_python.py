import asyncio
import inspect
import logging
import traceback
import sys
from typing import Any, Dict

from opentrons.drivers.smoothie_drivers.errors import SmoothieAlarm
from opentrons.protocol_api.contexts import ProtocolContext
from opentrons.protocols.execution.errors import ExceptionInProtocolError
from opentrons.protocols.types import PythonProtocol, MalformedProtocolError
from opentrons.hardware_control import ExecutionCancelledError

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


def run_python(proto: PythonProtocol, context: ProtocolContext):
    new_globs: Dict[Any, Any] = {}
    exec(proto.contents, new_globs)
    # If the protocol is written correctly, it will have defined a function
    # like run(context: ProtocolContext). If so, that function is now in the
    # current scope.
    if proto.filename and proto.filename.endswith("zip"):
        filename = "protocol.ot2.py"
    else:
        filename = proto.filename or "<protocol>"
    try:
        _runfunc_ok(new_globs.get("run"))
    except SyntaxError as se:
        raise MalformedProtocolError(str(se))
    new_globs["__context"] = context
    try:
        exec("run(__context)", new_globs)
    except (SmoothieAlarm, asyncio.CancelledError, ExecutionCancelledError):
        # this is a protocol cancel and shouldn't have special logging
        raise
    except Exception as e:
        exc_type, exc_value, tb = sys.exc_info()
        try:
            frame = _find_protocol_error(tb, filename)
        except KeyError:
            # No pretty names, just raise it
            raise e
        raise ExceptionInProtocolError(e, tb, str(e), frame.lineno) from e
