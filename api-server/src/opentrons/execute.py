""" opentrons.execute: functions and entrypoint for running protocols

This module has functions that can be imported to provide protocol
contexts for running protocols during interactive sessions like Jupyter or just
regular python shells. It also provides a console entrypoint for running a
protocol from the command line.
"""

import argparse
import asyncio
import logging
import os
import sys
import threading
from typing import Any, Callable, Dict, List, Optional, TextIO, Union

import opentrons
from opentrons import protocol_api, __version__
from opentrons.config import IS_ROBOT, JUPYTER_NOTEBOOK_LABWARE_DIR
from opentrons.protocol_api import (execute as execute_apiv2,
                                    MAX_SUPPORTED_VERSION)
from opentrons import commands
from opentrons.protocols.parse import parse, version_from_string
from opentrons.protocols.types import APIVersion, PythonProtocol
from opentrons.hardware_control import API
from .util.entrypoint_util import labware_from_paths, datafiles_from_paths

_HWCONTROL: Optional[API] = None
#: The background global cache that all protocol contexts created by
#: :py:meth:`get_protocol_api` will share


def get_protocol_api(
        version: Union[str, APIVersion],
        bundled_labware: Dict[str, Dict[str, Any]] = None,
        bundled_data: Dict[str, bytes] = None,
        extra_labware: Dict[str, Any] = None,
) -> protocol_api.ProtocolContext:
    """
    Build and return a :py:class:`ProtocolContext` connected to the robot.

    This can be used to run protocols from interactive Python sessions
    such as Jupyter or an interpreter on the command line:

    .. code-block:: python

        >>> from opentrons.execute import get_protocol_api
        >>> protocol = get_protocol_api('2.0')
        >>> instr = protocol.load_instrument('p300_single', 'right')
        >>> instr.home()

    If ``extra_labware`` is not specified, any labware definitions saved in
    the ``labware`` directory of the Jupyter notebook directory will be
    available.

    When this function is called, modules and instruments will be recached.

    :param version: The API version to use. This must be lower than
                    :py:attr:`opentrons.protocol_api.MAX_SUPPORTED_VERSION`.
                    It may be specified either as a string (``'2.0'``) or
                    as a :py:class:`.protocols.types.APIVersion`
                    (``APIVersion(2, 0)``).
    :param bundled_labware: If specified, a mapping from labware names to
                            labware definitions for labware to consider in the
                            protocol. Note that if you specify this, _only_
                            labware in this argument will be allowed in the
                            protocol. This is preparation for a beta feature
                            and is best not used.
    :param bundled_data: If specified, a mapping from filenames to contents
                         for data to be available in the protocol from
                         :py:attr:`.ProtocolContext.bundled_data`.
    :param extra_labware: If specified, a mapping from labware names to
                          labware definitions for labware to consider in the
                          protocol in addition to those stored on the robot.
                          If this is an empty dict, and this function is called
                          on a robot, it will look in the 'labware'
                          subdirectory of the Jupyter data directory for
                          custom labware.
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
    if isinstance(version, str):
        checked_version = version_from_string(version)
    elif not isinstance(version, APIVersion):
        raise TypeError('version must be either a string or an APIVersion')
    else:
        checked_version = version

    if extra_labware is None\
       and IS_ROBOT\
       and JUPYTER_NOTEBOOK_LABWARE_DIR.is_dir():  # type: ignore
        extra_labware = labware_from_paths(
            [str(JUPYTER_NOTEBOOK_LABWARE_DIR)])

    context = protocol_api.ProtocolContext(hardware=_HWCONTROL,
                                           bundled_labware=bundled_labware,
                                           bundled_data=bundled_data,
                                           extra_labware=extra_labware,
                                           api_version=checked_version)
    context._hw_manager.hardware.cache_instruments()
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
        '-L', '--custom-labware-path',
        action='append', default=[os.getcwd()],
        help='Specify directories to search for custom labware definitions. '
             'You can specify this argument multiple times. Once you specify '
             'a directory in this way, labware definitions in that directory '
             'will become available in ProtocolContext.load_labware(). '
             'Only directories specified directly by '
             'this argument are searched, not their children. JSON files that '
             'do not define labware will be ignored with a message. '
             'By default, the current directory (the one in which you are '
             'invoking this program) will be searched for labware.')
    parser.add_argument(
        '-D', '--custom-data-path',
        action='append', nargs='?', const='.', default=[],
        help='Specify directories to search for custom data files. '
             'You can specify this argument multiple times. Once you specify '
             'a directory in this way, files located in the specified '
             'directory will be available in ProtocolContext.bundled_data. '
             'Note that bundle execution will still only allow data files in '
             'the bundle. If you specify this without a path, it will '
             'add the current path implicitly. If you do not specify this '
             'argument at all, no data files will be added. Any file in the '
             'specified paths will be loaded into memory and included in the '
             'bundle if --bundle is passed, so be careful that any directory '
             'you specify has only the files you want. It is usually a '
             'better idea to use -d so no files are accidentally included. '
             'Also note that data files are made available as their name, not '
             'their full path, so name them uniquely.')
    parser.add_argument(
        '-d', '--custom-data-file',
        action='append', default=[],
        help='Specify data files to be made available in '
             'ProtocolContext.bundled_data (and possibly bundled if --bundle '
             'is passed). Can be specified multiple times with different '
             'files. It is usually a better idea to use this than -D because '
             'there is less possibility of accidentally including something.')
    parser.add_argument(
        'protocol', metavar='PROTOCOL',
        type=argparse.FileType('rb'),
        help='The protocol file to execute. If you pass \'-\', you can pipe '
        'the protocol via stdin; this could be useful if you want to use this '
        'utility as part of an automated workflow.')
    return parser


def execute(protocol_file: TextIO,
            protocol_name: str,
            propagate_logs: bool = False,
            log_level: str = 'warning',
            emit_runlog: Callable[[Dict[str, Any]], None] = None,
            custom_labware_paths: List[str] = None,
            custom_data_paths: List[str] = None):
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
    :param str protocol_name: The name of the protocol file. This is required
                              internally, but it may not be a thing we can get
                              from the protocol_file argument.
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
    :param custom_labware_paths: A list of directories to search for custom
                                 labware, or None. Ignored if the apiv2 feature
                                 flag is not set. Loads valid labware from
                                 these paths and makes them available to the
                                 protocol context.
    :param custom_data_paths: A list of directories or files to load custom
                              data files from. Ignored if the apiv2 feature
                              flag if not set. Entries may be either files or
                              directories. Specified files and the
                              non-recursive contents of specified directories
                              are presented by the protocol context in
                              :py:attr:`.ProtocolContext.bundled_data`.
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
    if custom_labware_paths:
        extra_labware = labware_from_paths(custom_labware_paths)
    else:
        extra_labware = {}
    if custom_data_paths:
        extra_data = datafiles_from_paths(custom_data_paths)
    else:
        extra_data = {}
    protocol = parse(contents, protocol_name,
                     extra_labware=extra_labware,
                     extra_data=extra_data)
    if getattr(protocol, 'api_level', APIVersion(2, 0)) < APIVersion(2, 0):
        opentrons.robot.connect()
        opentrons.robot.cache_instrument_models()
        opentrons.robot.discover_modules()
        opentrons.robot.home()
        if emit_runlog:
            opentrons.robot.broker.subscribe(
                commands.command_types.COMMAND, emit_runlog)
        assert isinstance(protocol, PythonProtocol),\
            'Internal error: Only Python protocols may be executed in v1'
        exec(protocol.contents, {})
    else:
        bundled_data = getattr(protocol, 'bundled_data', {})
        bundled_data.update(extra_data)
        gpa_extras = getattr(protocol, 'extra_labware', None) or None
        context = get_protocol_api(
            getattr(protocol, 'api_level', MAX_SUPPORTED_VERSION),
            bundled_labware=getattr(protocol, 'bundled_labware', None),
            bundled_data=bundled_data,
            extra_labware=gpa_extras)
        if emit_runlog:
            context.broker.subscribe(
                commands.command_types.COMMAND, emit_runlog)
        context.home()
        execute_apiv2.run_protocol(protocol, context)
        context.cleanup()


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
    # Try to migrate containers from database to v2 format
    execute(args.protocol, args.protocol.name,
            log_level=log_level, emit_runlog=printer)
    return 0


if __name__ == '__main__':
    sys.exit(main())
