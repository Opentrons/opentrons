import inspect
import logging
import traceback
import sys
from typing import Any, Callable

from .contexts import ProtocolContext
from . import execute_v3

from opentrons.protocols.types import PythonProtocol, Protocol, APIVersion

MODULE_LOG = logging.getLogger(__name__)

PROTOCOL_MALFORMED = """

A Python protocol for the OT2 must define a function called 'run' that takes a
single argument: the protocol context to call functions on. For instance, a run
function might look like this:

def run(ctx):
    ctx.comment('hello, world')

This function is called by the robot when the robot executes the protol.
This function is not present in the current protocol and must be added.
"""


class ExceptionInProtocolError(Exception):
    """ This exception wraps an exception that was raised from a protocol
    for proper error message formatting by the rpc, since it's only here that
    we can properly figure out formatting
    """

    def __init__(self, original_exc, original_tb, message, line):
        self.original_exc = original_exc
        self.original_tb = original_tb
        self.message = message
        self.line = line
        super().__init__(original_exc, original_tb, message, line)

    def __str__(self):
        return '{}{}: {}'.format(
            self.original_exc.__class__.__name__,
            ' [line {}]'.format(self.line) if self.line else '',
            self.message)


class MalformedProtocolError(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(message)

    def __str__(self):
        return self._msg + PROTOCOL_MALFORMED

    def __repr__(self):
        return '<{}: {}>'.format(self.__class__.__name__, self.message)


def _runfunc_ok(run_func: Any) -> Callable[[ProtocolContext], None]:
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
                    "argument but would be called as 'run(ctx)'"
                    .format(str(sig)))
    return run_func  # type: ignore


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


def _run_python(
        proto: PythonProtocol, context: ProtocolContext):
    new_locs = locals()
    new_globs = globals()
    exec(proto.contents, new_globs, new_locs)
    # If the protocol is written correctly, it will have defined a function
    # like run(context: ProtocolContext). If so, that function is now in the
    # current scope.
    if proto.filename and proto.filename.endswith('zip'):
        filename = 'protocol.ot2.py'
    else:
        filename = proto.filename or '<protocol>'
    try:
        _runfunc_ok(new_locs.get('run'))
    except SyntaxError as se:
        raise MalformedProtocolError(str(se))
    new_globs.update(new_locs)
    try:
        exec('run(context)', new_globs, new_locs)
    except Exception as e:
        exc_type, exc_value, tb = sys.exc_info()
        try:
            frame = _find_protocol_error(tb, filename)
        except KeyError:
            # No pretty names, just raise it
            raise e
        raise ExceptionInProtocolError(e, tb, str(e), frame.lineno)


def run_protocol(protocol: Protocol,
                 context: ProtocolContext):
    """ Run a protocol.

    :param protocol: The :py:class:`.protocols.types.Protocol` to execute
    :param context: The context to use.
    """

    # Before running any protocol, ensure that the robot is properly set up
    # Currently, the only thing ensured is that Smoothie acceleration is set to
    # default
    context.set_acceleration()

    if isinstance(protocol, PythonProtocol):
        if protocol.api_level >= APIVersion(2, 0):
            _run_python(protocol, context)
        else:
            raise RuntimeError(
                f'Unsupported python API version: {protocol.api_level}'
            )
    else:
        if protocol.schema_version == 3:
            ins = execute_v3.load_pipettes_from_json(
                context, protocol.contents)
            lw = execute_v3.load_labware_from_json_defs(
                context, protocol.contents)
            execute_v3.dispatch_json(context, protocol.contents, ins, lw)
        else:
            raise RuntimeError(
                f'Unsupported JSON protocol schema: {protocol.schema_version}')
