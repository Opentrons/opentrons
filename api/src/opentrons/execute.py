""" opentrons.execute: functions and entrypoint for running protocols

This module has functions that can be imported to provide protocol
contexts for running protocols during interactive sessions like Jupyter or just
regular python shells. It also provides a console entrypoint for running a
protocol from the command line.
"""

import argparse
import asyncio
import logging
import sys
import threading
from typing import Any, Callable, Dict, Optional, TextIO

from opentrons import protocol_api, __version__
from opentrons.protocol_api import execute as execute_apiv2
from opentrons import commands
from opentrons.config import feature_flags as ff
from opentrons.protocols.parse import parse
from opentrons.protocols.types import JsonProtocol
from opentrons.hardware_control import API

_HWCONTROL: Optional[API] = None
#: The background global cache that all protocol contexts created by
#: :py:meth:`get_protocol_api` will share


def get_protocol_api(
        bundled_labware: Dict[str, Dict[str, Any]] = None,
        bundled_data: Dict[str, bytes] = None
) -> protocol_api.ProtocolContext:
    """
    Build and return a :py:class:`ProtocolContext` connected to the robot.

    This can be used to run protocols from interactive Python sessions
    such as Jupyter or an interpreter on the command line:

    .. code-block:: python

        >>> from opentrons.execute import get_protocol_api
        >>> protocol = get_protocol_api()
        >>> instr = protocol.load_instrument('p300_single', 'right')
        >>> instr.home()

    When this function is called, modules and instruments will be recached.

    :param bundled_labware: If specified, a mapping from labware names to
                            labware definitions for labware to consider in the
                            protocol. Note that if you specify this, _only_
                            labware in this argument will be allowed in the
                            protocol. This is preparation for a beta feature
                            and is best not used.
    :param bundled_data: If specified, a mapping from filenames to contents
                         for data to be available in the protocol from
                         :py:attr:`.ProtocolContext.bundled_data`.

    :returns opentrons.protocol_api.ProtocolContext: The protocol context.
    """
    if not _HWCONTROL:
        # Build a hardware controller in a worker thread, which is necessary
        # because ipython runs its notebook in asyncio but the notebook
        # is at script/repl scope not function scope and is synchronous so
        # you can't control the loop from inside. If we update to
        # IPython 7 we can avoid this, but for now we can't
        def _build_hwcontroller():
            global _HWCONTROL
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
            _HWCONTROL = loop.run_until_complete(
                API.build_hardware_controller())

        thread = threading.Thread(
            target=_build_hwcontroller,
            name='Hardware-controller-builder')
        thread.start()
        thread.join()

    context = protocol_api.ProtocolContext(hardware=_HWCONTROL,
                                           bundled_labware=bundled_labware,
                                           bundled_data=bundled_data)
    context._hw_manager.hardware.cache_instruments()
    context._hw_manager.hardware.discover_modules()
    return context


def get_arguments(
        parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    """ Get the argument parser for this module

    Useful if you want to use this module as a component of another CLI program
    and want to add its arguments.

    :param parser: A parser to add arguments to.
    :returns argparse.ArgumentParser: The parser with arguments added.
    """
    parser.add_argument(
        '-l', '--log-level',
        choices=['debug', 'info', 'warning', 'error', 'none'],
        default='warning',
        help='Specify the level filter for logs to show on the command line. '
        'The logs stored in journald or local log files are unaffected by '
        'this option and should be configured in the config file. If '
        '\'none\', do not show logs')
    parser.add_argument(
        'protocol', metavar='PROTOCOL',
        type=argparse.FileType('rb'),
        help='The protocol file to execute. If you pass \'-\', you can pipe '
        'the protocol via stdin; this could be useful if you want to use this '
        'utility as part of an automated workflow.')
    return parser


def execute(protocol_file: TextIO,
            propagate_logs: bool = False,
            log_level: str = 'warning',
            emit_runlog: Callable[[Dict[str, Any]], None] = None):
    """
    Run the protocol itself.

    This is a one-stop function to run a protocol, whether python or json,
    no matter the api verson, from external (i.e. not bound up in other
    internal server infrastructure) sources.

    To run an opentrons protocol from other places, pass in a file like
    object as protocol_file; this function either returns (if the run has no
    problems) or raises an exception.

    To call from the command line use either the autogenerated entrypoint
    ``opentrons_execute`` or ``python -m opentrons.execute``.

    If the protocol is using Opentrons Protocol API V1, it does not need to
    explicitly call :py:meth:`.Robot.connect`
    or :py:meth:`.Robot.discover_modules`, or
    :py:meth:`.Robot.cache_instrument_models`.

    :param file-like protocol_file: The protocol file to execute
    :param propagate_logs: Whether this function should allow logs from the
                           Opentrons stack to propagate up to the root handler.
                           This can be useful if you're integrating this
                           function in a larger application, but most logs that
                           occur during protocol simulation are best associated
                           with the actions in the protocol that cause them.
                           Default: ``False``
    :type propagate_logs: bool
    :param log_level: The level of logs to emit on the command line.. Default:
                      'warning'
    :type log_level: 'debug', 'info', 'warning', or 'error'
    :param emit_runlog: A callback for printing the runlog. If specified, this
                        will be called whenever a command adds an entry to the
                        runlog, which can be used for display and progress
                        estimation. If specified, the callback should take a
                        single argument (the name doesn't matter) which will
                        be a dictionary (see below). Default: ``None``

    The format of the runlog entries is as follows:

    .. code-block:: python

        {
            'name': command_name,
            'payload': {
                 'text': string_command_text,
                  # The rest of this struct is command-dependent; see
                  # opentrons.commands.commands. Its keys match format
                  # keys in 'text', so that
                  # entry['payload']['text'].format(**entry['payload'])
                  # will produce a string with information filled in
             }
        }


    """
    stack_logger = logging.getLogger('opentrons')
    stack_logger.propagate = propagate_logs
    stack_logger.setLevel(getattr(logging, log_level.upper(), logging.WARNING))
    contents = protocol_file.read()
    protocol = parse(contents, protocol_file.name)
    if isinstance(protocol, JsonProtocol)\
            or protocol.api_level == '2'\
            or (ff.enable_backcompat() and ff.use_protocol_api_v2()):
        context = get_protocol_api(
            bundled_labware=getattr(protocol, 'bundled_labware', None),
            bundled_data=getattr(protocol, 'bundled_data', None))
        if emit_runlog:
            context.broker.subscribe(
                commands.command_types.COMMAND, emit_runlog)
        context.home()
        execute_apiv2.run_protocol(protocol,
                                   simulate=False,
                                   context=context)
    else:
        from opentrons import robot
        from opentrons.legacy_api import protocols
        robot.connect()
        robot.cache_instrument_models()
        robot.discover_modules()
        robot.home()
        if emit_runlog:
            robot.broker.subscribe(
                commands.command_types.COMMAND, emit_runlog)
        if isinstance(protocol, JsonProtocol):
            protocols.execute_protocol(protocol)
        else:
            exec(protocol.contents, {})


def make_runlog_cb():
    level = 0
    last_dollar = None

    def _print_runlog(command: Dict[str, Any]):
        nonlocal level
        nonlocal last_dollar

        if last_dollar == command['$']:
            if command['$'] == 'before':
                level += 1
            else:
                level -= 1
        last_dollar = command['$']
        if command['$'] == 'before':
            print(' '.join([
                '\t' * level,
                command['payload'].get('text', '')
                .format(**command['payload'])]))

    return _print_runlog


def main() -> int:
    """ Handler for command line invocation to run a protocol.

    :param argv: The arguments the program was invoked with; this is usually
                 :py:attr:`sys.argv` but if you want to override that you can.
    :returns int: A success or failure value suitable for use as a shell
                  return code passed to :py:meth:`sys.exit` (0 means success,
                  anything else is a kind of failure).
    """
    parser = argparse.ArgumentParser(prog='opentrons_execute',
                                     description='Run an OT-2 protocol')
    parser = get_arguments(parser)
    # don't want to add this in get_arguments because if somebody upstream is
    # using that parser they probably want their own version
    parser.add_argument(
        '-v', '--version', action='version', version=__version__)
    parser.add_argument(
        '-n', '--no-print-runlog', action='store_true',
        help='Do not print the commands as they are executed')
    args = parser.parse_args()
    printer = None if args.no_print_runlog else make_runlog_cb()
    if args.log_level != 'none':
        stack_logger = logging.getLogger('opentrons')
        stack_logger.addHandler(logging.StreamHandler(sys.stdout))
        log_level = args.log_level
    else:
        log_level = 'warning'
    execute(args.protocol, log_level=log_level, emit_runlog=printer)
    return 0


if __name__ == '__main__':
    sys.exit(main())
