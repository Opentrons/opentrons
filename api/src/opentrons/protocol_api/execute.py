import inspect
import logging
import os
from typing import Any, Callable

from .contexts import ProtocolContext

MODULE_LOG = logging.getLogger(__name__)


def _runfunc_ok(run_func: Any) -> Callable[[ProtocolContext], None]:
    if not callable(run_func):
        raise SyntaxError("No function 'run()' defined")
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


def _run_python(proto: Any, context: ProtocolContext):
    new_locs = locals()
    new_globs = globals()
    exec(proto, new_globs, new_locs)
    # If the protocol is written correctly, it will have defined a function
    # like run(context: ProtocolContext). If so, that function is now in the
    # current scope.
    try:
        _runfunc_ok(new_locs.get('run'))
    except SyntaxError as se:
        raise SyntaxError(
            str(se),
            "No function run(ctx) defined"
            "\nA Python protocol for the OT2 must define a function "
            "called 'run' that takes a single argument - the"
            "protocol context to call functions on. For instance, "
            "a run function might look like\n\n"
            "def run(ctx):\n"
            "    ctx.comment('hello, world')"
            "\n\nThis function is called by the robot when the "
            "robot executes the protol. However, it is not "
            "present.")
    new_globs.update(new_locs)
    exec('run(context)', new_globs, new_locs)


def run_protocol(protocol_code: Any = None,
                 protocol_json: str = None,
                 simulate: bool = False,
                 context: ProtocolContext = None):
    """ Create a ProtocolRunner instance from one of a variety of protocol
    sources.

    :param protocol_bytes: If the protocol is a Python protocol, pass the
    file contents here.
    :param protocol_json: If the protocol is a json file, pass the contents
    here.
    :param simulate: True to simulate; False to execute. If this is not an
    OT2, ``simulate`` will be forced ``True``.
    :param context: The context to use. If ``None``, create a new
    ProtocolContext.
    """
    if not os.environ.get('RUNNING_ON_PI'):
        simulate = True # noqa - will be used later
    if None is context and simulate:
        true_context = ProtocolContext()
        MODULE_LOG.info("Generating blank protocol context for simulate")
    elif context:
        true_context = context
    else:
        raise RuntimeError(
            'Will not automatically generate hardware controller')
    _run_python(protocol_code, true_context)
