""" opentrons.simulate: functions and entrypoints for simulating protocols

This module has functions that provide a console entrypoint for simulating
a protocol from the command line.
"""
import argparse
import sys
import logging
import os
import pathlib
import queue
from typing import (
    Any,
    Dict,
    List,
    Mapping,
    TextIO,
    Tuple,
    BinaryIO,
    Optional,
    Union,
)
from typing_extensions import Literal

import opentrons
from opentrons import should_use_ot3
from opentrons.hardware_control import (
    API as OT2API,
    ThreadManager,
    ThreadManagedHardware,
)

from opentrons.hardware_control.simulator_setup import load_simulator
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocols.duration import DurationEstimator
from opentrons.protocols.execution import execute
from opentrons.legacy_broker import LegacyBroker
from opentrons.config import IS_ROBOT
from opentrons import protocol_api
from opentrons.commands import types as command_types

from opentrons.protocols import parse, bundle
from opentrons.protocols.types import PythonProtocol, BundleContents
from opentrons.protocols.api_support.deck_type import (
    guess_from_global_config as guess_deck_type_from_global_config,
)
from opentrons.protocols.api_support.types import APIVersion
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons_shared_data.robot.dev_types import RobotType

from .util.entrypoint_util import (
    find_jupyter_labware,
    labware_from_paths,
    datafiles_from_paths,
)


# See Jira RCORE-535.
_PYTHON_TOO_NEW_MESSAGE = (
    "Python protocols with apiLevels higher than 2.13"
    " cannot currently be simulated with"
    " the opentrons_simulate command-line tool,"
    " the opentrons.simulate.simulate() function,"
    " or the opentrons.simulate.get_protocol_api() function."
    " Use a lower apiLevel"
    " or use the Opentrons App instead."
)
_JSON_TOO_NEW_MESSAGE = (
    "Protocols created by recent versions of Protocol Designer"
    " cannot currently be simulated with"
    " the opentrons_simulate command-line tool"
    " or the opentrons.simulate.simulate() function."
    " Use the Opentrons App instead."
)


# TODO(mm, 2023-10-05): Deduplicate this with opentrons.protocols.parse().
_UserSpecifiedRobotType = Literal["OT-2", "Flex"]
"""The user-facing robot type specifier.

This should match what `opentrons.protocols.parse()` accepts in a protocol's `requirements` dict.
"""


class AccumulatingHandler(logging.Handler):
    def __init__(
        self,
        level: str,
        command_queue: "queue.Queue[Any]",
    ) -> None:
        """Create the handler

        :param level: The logging level to capture
        :param command_queue: The queue.Queue to use for messages
        """
        self._command_queue = command_queue
        super().__init__(level)

    def emit(self, record: Any) -> None:
        self._command_queue.put(record)


class CommandScraper:
    """An object that handles scraping the broker for commands

    This should be instantiated with the logger to integrate
    messages from (e.g. ``logging.getLogger('opentrons')``), the
    level to scrape, and the opentrons broker object to subscribe to.

    The :py:attr:`commands` property contains the list of commands
    and log messages integrated together. Each element of the list is
    a dict following the pattern in the docs of :py:obj:`simulate`.
    """

    def __init__(
        self, logger: logging.Logger, level: str, broker: LegacyBroker
    ) -> None:
        """Build the scraper.

        :param logger: The :py:class:`logging.logger` to scrape
        :param level: The log level to scrape
        :param broker: Which broker to subscribe to
        """
        self._logger = logger
        self._broker = broker
        self._queue = queue.Queue()  # type: ignore
        if level != "none":
            level = getattr(logging, level.upper(), logging.WARNING)
            self._logger.setLevel(level)
            self._handler: Optional[AccumulatingHandler] = AccumulatingHandler(
                level, self._queue
            )
            logger.addHandler(self._handler)
        else:
            self._handler = None
        self._depth = 0
        self._commands: List[Mapping[str, Any]] = []
        self._unsub = self._broker.subscribe(
            command_types.COMMAND, self._command_callback
        )

    @property
    def commands(self) -> List[Mapping[str, Mapping[str, Any]]]:
        """The list of commands. See :py:obj:`simulate`"""
        return self._commands

    def __del__(self) -> None:
        if getattr(self, "_handler", None):
            try:
                self._logger.removeHandler(self._handler)  # type: ignore
            except Exception:
                pass
        if hasattr(self, "_unsub"):
            self._unsub()

    def _command_callback(self, message: command_types.CommandMessage) -> None:
        """The callback subscribed to the broker"""
        payload = message["payload"]
        if message["$"] == "before":
            self._commands.append(
                {"level": self._depth, "payload": payload, "logs": []}
            )
            self._depth += 1
        else:
            while not self._queue.empty():
                self._commands[-1]["logs"].append(self._queue.get())
            self._depth = max(self._depth - 1, 0)


def get_protocol_api(
    version: Union[str, APIVersion],
    bundled_labware: Optional[Dict[str, LabwareDefinition]] = None,
    bundled_data: Optional[Dict[str, bytes]] = None,
    extra_labware: Optional[Dict[str, LabwareDefinition]] = None,
    hardware_simulator: Optional[ThreadManagedHardware] = None,
    # Additional arguments are kw-only to make mistakes harder in environments without
    # type checking, like Jupyter Notebook.
    *,
    robot_type: Optional[_UserSpecifiedRobotType] = None,
) -> protocol_api.ProtocolContext:
    """
    Build and return a ``protocol_api.ProtocolContext``
    connected to Virtual Smoothie.

    This can be used to run protocols from interactive Python sessions
    such as Jupyter or an interpreter on the command line:

    .. code-block:: python

        >>> from opentrons.simulate import get_protocol_api
        >>> protocol = get_protocol_api('2.0')
        >>> instr = protocol.load_instrument('p300_single', 'right')
        >>> instr.home()

    :param version: The API version to use. This must be lower than
                    ``opentrons.protocol_api.MAX_SUPPORTED_VERSION``.
                    It may be specified either as a string (``'2.0'``) or
                    as a ``protocols.types.APIVersion``
                    (``APIVersion(2, 0)``).
    :param bundled_labware: If specified, a mapping from labware names to
                            labware definitions for labware to consider in the
                            protocol. Note that if you specify this, _only_
                            labware in this argument will be allowed in the
                            protocol. This is preparation for a beta feature
                            and is best not used.
    :param bundled_data: If specified, a mapping from filenames to contents
                         for data to be available in the protocol from
                         :py:obj:`opentrons.protocol_api.ProtocolContext.bundled_data`.
    :param extra_labware: A mapping from labware load names to custom labware definitions.
                          If this is ``None`` (the default), and this function is called on a robot,
                          it will look for labware in the ``labware`` subdirectory of the Jupyter
                          data directory.
    :param hardware_simulator: If specified, a hardware simulator instance.
    :param robot_type: The type of robot to simulate: either ``"Flex"`` or ``"OT-2"``.
                       If you're running this function on a robot, the default is the type of that
                       robot. Otherwise, the default is ``"OT-2"``, for backwards compatibility.
    :return: The protocol context.
    """
    if isinstance(version, str):
        checked_version = parse.version_from_string(version)
    elif not isinstance(version, APIVersion):
        raise TypeError("version must be either a string or an APIVersion")
    else:
        checked_version = version

    current_robot_type = _get_current_robot_type()
    if robot_type is None:
        if current_robot_type is None:
            parsed_robot_type: RobotType = "OT-2 Standard"
        else:
            parsed_robot_type = current_robot_type
    else:
        # TODO(mm, 2023-10-09): This raises a slightly wrong error message, mentioning the camelCase
        # `robotType` field in Python files instead of the snake_case `robot_type` argument for this
        # function.
        parsed_robot_type = parse.robot_type_from_python_identifier(robot_type)
    _validate_can_simulate_for_robot_type(parsed_robot_type)

    if extra_labware is None:
        extra_labware = {
            uri: details.definition
            for uri, details in (find_jupyter_labware() or {}).items()
        }

    checked_hardware = _check_hardware_simulator(hardware_simulator, parsed_robot_type)
    return _build_protocol_context(
        version=checked_version,
        hardware_simulator=checked_hardware,
        bundled_labware=bundled_labware,
        bundled_data=bundled_data,
        extra_labware=extra_labware,
    )


def _check_hardware_simulator(
    hardware_simulator: Optional[ThreadManagedHardware], robot_type: RobotType
) -> ThreadManagedHardware:
    if hardware_simulator:
        return hardware_simulator
    elif robot_type == "OT-3 Standard":
        # Local import because this isn't available on OT-2s.
        from opentrons.hardware_control.ot3api import OT3API

        return ThreadManager(OT3API.build_hardware_simulator)
    elif robot_type == "OT-2 Standard":
        return ThreadManager(OT2API.build_hardware_simulator)


def _build_protocol_context(
    version: APIVersion,
    hardware_simulator: ThreadManagedHardware,
    bundled_labware: Optional[Dict[str, LabwareDefinition]],
    bundled_data: Optional[Dict[str, bytes]],
    extra_labware: Optional[Dict[str, LabwareDefinition]],
) -> protocol_api.ProtocolContext:
    """Internal version of :py:meth:`get_protocol_api` that allows deferring
    version specification for use with
    :py:meth:`.protocol_api.execute.run_protocol`
    """
    try:
        context = protocol_api.create_protocol_context(
            api_version=version,
            hardware_api=hardware_simulator,
            # FIXME(2022-12-02): Instead of guessing,
            # match this to the robot type declared by the protocol.
            # https://opentrons.atlassian.net/browse/RSS-156
            deck_type=guess_deck_type_from_global_config(),
            bundled_labware=bundled_labware,
            bundled_data=bundled_data,
            extra_labware=extra_labware,
            use_simulating_core=True,
        )
    except protocol_api.ProtocolEngineCoreRequiredError as e:
        raise NotImplementedError(_PYTHON_TOO_NEW_MESSAGE) from e  # See Jira RCORE-535.
    context.home()
    return context


def _get_current_robot_type() -> Optional[RobotType]:
    """Return the type of robot that we're running on, or None if we're not on a robot."""
    if IS_ROBOT:
        return "OT-3 Standard" if should_use_ot3() else "OT-2 Standard"
    else:
        return None


def _validate_can_simulate_for_robot_type(robot_type: RobotType) -> None:
    """Raise if this device cannot simulate protocols written for the given robot type."""
    current_robot_type = _get_current_robot_type()
    if current_robot_type is None:
        # When installed locally, this package can simulate protocols for any robot type.
        pass
    elif robot_type != current_robot_type:
        # Match robot server behavior: raise an early warning if we're on a robot and the caller
        # tries to simulate a protocol written for a different robot type.

        # FIXME: This exposes the internal strings "OT-2 Standard" and "OT-3 Standard".
        # https://opentrons.atlassian.net/browse/RSS-370
        raise RuntimeError(
            f'This robot is of type "{current_robot_type}",'
            f' so it can\'t simulate protocols for robot type "{robot_type}"'
        )


def bundle_from_sim(
    protocol: PythonProtocol, context: opentrons.protocol_api.ProtocolContext
) -> BundleContents:
    """
    From a protocol, and the context that has finished simulating that
    protocol, determine what needs to go in a bundle for the protocol.
    """
    bundled_labware: Dict[str, LabwareDefinition] = {}
    for lw in context.loaded_labwares.values():
        if (
            isinstance(lw, opentrons.protocol_api.labware.Labware)
            and lw.uri not in bundled_labware
        ):
            bundled_labware[lw.uri] = lw._core.get_definition()

    return BundleContents(
        protocol.text,
        bundled_data=context.bundled_data,
        bundled_labware=bundled_labware,
        bundled_python={},
    )


def simulate(  # noqa: C901
    protocol_file: Union[BinaryIO, TextIO],
    file_name: Optional[str] = None,
    custom_labware_paths: Optional[List[str]] = None,
    custom_data_paths: Optional[List[str]] = None,
    propagate_logs: bool = False,
    hardware_simulator_file_path: Optional[str] = None,
    duration_estimator: Optional[DurationEstimator] = None,
    log_level: str = "warning",
) -> Tuple[List[Mapping[str, Any]], Optional[BundleContents]]:
    """
    Simulate the protocol itself.

    This is a one-stop function to simulate a protocol, whether python or json,
    no matter the api version, from external (i.e. not bound up in other
    internal server infrastructure) sources.

    To simulate an opentrons protocol from other places, pass in a file like
    object as protocol_file; this function either returns (if the simulation
    has no problems) or raises an exception.

    To call from the command line use either the autogenerated entrypoint
    ``opentrons_simulate`` (``opentrons_simulate.exe``, on windows) or
    ``python -m opentrons.simulate``.

    The return value is the run log, a list of dicts that represent the
    commands executed by the robot; and either the contents of the protocol
    that would be required to bundle, or ``None``.

    Each dict element in the run log has the following keys:

        - ``level``: The depth at which this command is nested - if this an
                     aspirate inside a mix inside a transfer, for instance,
                     it would be 3.
        - ``payload``: The command, its arguments, and how to format its text.
                       For more specific details see
                       ``opentrons.commands``. To format a message from
                       a payload do ``payload['text'].format(**payload)``.
        - ``logs``: Any log messages that occurred during execution of this
                    command, as a logging.LogRecord

    :param protocol_file: The protocol file to simulate.
    :param file_name: The name of the file
    :param custom_labware_paths: A list of directories to search for custom labware.
                                 Loads valid labware from these paths and makes them available
                                 to the protocol context. If this is ``None`` (the default), and
                                 this function is called on a robot, it will look in the ``labware``
                                 subdirectory of the Jupyter data directory.
    :param custom_data_paths: A list of directories or files to load custom
                              data files from. Ignored if the apiv2 feature
                              flag if not set. Entries may be either files or
                              directories. Specified files and the
                              non-recursive contents of specified directories
                              are presented by the protocol context in
                              ``protocol_api.ProtocolContext.bundled_data``.
    :param hardware_simulator_file_path: A path to a JSON file defining a
                                         hardware simulator.
    :param duration_estimator: For internal use only.
                               Optional duration estimator object.
    :param propagate_logs: Whether this function should allow logs from the
                           Opentrons stack to propagate up to the root handler.
                           This can be useful if you're integrating this
                           function in a larger application, but most logs that
                           occur during protocol simulation are best associated
                           with the actions in the protocol that cause them.
                           Default: ``False``
    :param log_level: The level of logs to capture in the runlog:
                      ``"debug"``, ``"info"``, ``"warning"``, or ``"error"``.
                      Defaults to ``"warning"``.
    :returns: A tuple of a run log for user output, and possibly the required
              data to write to a bundle to bundle this protocol. The bundle is
              only emitted if bundling is allowed
              and this is an unbundled Protocol API
              v2 python protocol. In other cases it is None.
    """
    stack_logger = logging.getLogger("opentrons")
    stack_logger.propagate = propagate_logs

    contents = protocol_file.read()

    # TODO(mm, 2023-10-02): Switch this truthy check to `is not None`
    # to match documented behavior.
    # See notes in https://github.com/Opentrons/opentrons/pull/13107
    if custom_labware_paths:
        extra_labware = labware_from_paths(custom_labware_paths)
    else:
        extra_labware = find_jupyter_labware() or {}

    if custom_data_paths:
        extra_data = datafiles_from_paths(custom_data_paths)
    else:
        extra_data = {}

    hardware_simulator = None

    if hardware_simulator_file_path:
        hardware_simulator = ThreadManager(
            load_simulator,
            pathlib.Path(hardware_simulator_file_path),
        )

    try:
        protocol = parse.parse(
            contents,
            file_name,
            extra_labware={
                uri: details.definition for uri, details in extra_labware.items()
            },
            extra_data=extra_data,
        )
    except parse.JSONSchemaVersionTooNewError as e:
        if e.attempted_schema_version == 6:
            # See Jira RCORE-535.
            raise NotImplementedError(_JSON_TOO_NEW_MESSAGE) from e
        else:
            raise

    bundle_contents: Optional[BundleContents] = None

    # we want a None literal rather than empty dict so get_protocol_api
    # will look for custom labware if this is a robot
    gpa_extras = getattr(protocol, "extra_labware", None) or None

    try:
        context = get_protocol_api(
            getattr(protocol, "api_level", MAX_SUPPORTED_VERSION),
            bundled_labware=getattr(protocol, "bundled_labware", None),
            bundled_data=getattr(protocol, "bundled_data", None),
            hardware_simulator=hardware_simulator,
            extra_labware=gpa_extras,
            robot_type="Flex" if protocol.robot_type == "OT-3 Standard" else "OT-2",
        )
    except protocol_api.ProtocolEngineCoreRequiredError as e:
        raise NotImplementedError(_PYTHON_TOO_NEW_MESSAGE) from e  # See Jira RCORE-535.

    broker = context.broker
    scraper = CommandScraper(stack_logger, log_level, broker)
    if duration_estimator:
        broker.subscribe(command_types.COMMAND, duration_estimator.on_message)

    try:
        execute.run_protocol(protocol, context)
        if (
            isinstance(protocol, PythonProtocol)
            and protocol.api_level >= APIVersion(2, 0)
            and protocol.bundled_labware is None
            and allow_bundle()
        ):
            bundle_contents = bundle_from_sim(protocol, context)
    finally:
        context.cleanup()

    return scraper.commands, bundle_contents


def format_runlog(runlog: List[Mapping[str, Any]]) -> str:
    """
    Format a run log (return value of :py:obj:`simulate`) into a
    human-readable string

    :param runlog: The output of a call to :py:obj:`simulate`
    """
    to_ret = []
    for command in runlog:
        to_ret.append("\t" * command["level"] + command["payload"].get("text", ""))
        if command["logs"]:
            to_ret.append("\t" * command["level"] + "Logs from this command:")
            to_ret.extend(
                [
                    "\t" * command["level"]
                    + f"{l.levelname} ({l.module}): {l.msg}" % l.args
                    for l in command["logs"]  # noqa: E741
                ]
            )
    return "\n".join(to_ret)


def _get_bundle_args(parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    parser.add_argument(
        "-b",
        "--bundle",
        nargs="?",
        const="PROTOCOL.ot2.zip",
        default=None,
        action="store",
        type=str,
        help="Bundle the specified protocol file, any labware used in it, and "
        "any files in the data directories specified with -D into a "
        "bundle. This bundle can be executed on a robot and carries with "
        "it all the custom labware and data required to run. Without a "
        "value specified in this argument, the bundle will be called "
        "(protocol name without the .py).ot2.zip, but you can specify "
        "a different output name. \n"
        "These bundles are a beta feature, and their behavior may change",
    )
    return parser


def allow_bundle() -> bool:
    """
    Check if bundling is allowed with a special not-exposed-to-the-app flag.

    Returns ``True`` if the environment variable
    ``OT_API_FF_allowBundleCreation`` is ``"1"``
    """
    return os.getenv("OT_API_FF_allowBundleCreation") == "1"


def get_arguments(parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    """Get the argument parser for this module

    Useful if you want to use this module as a component of another CLI program
    and want to add its arguments.

    :param parser: A parser to add arguments to. If not specified, one will be
                   created.
    :returns argparse.ArgumentParser: The parser with arguments added.
    """
    parser.add_argument(
        "-l",
        "--log-level",
        choices=["debug", "info", "warning", "error", "none"],
        default="warning",
        help="Specify the level filter for logs to show on the command line. "
        'Log levels below warning can be chatty. If "none", do not show logs',
    )

    parser.add_argument(
        "-L",
        "--custom-labware-path",
        action="append",
        default=[os.getcwd()],
        help="Specify directories to search for custom labware definitions. "
        "You can specify this argument multiple times. Once you specify "
        "a directory in this way, labware definitions in that directory "
        "will become available in ProtocolContext.load_labware(). "
        "Only directories specified directly by "
        "this argument are searched, not their children. JSON files that "
        "do not define labware will be ignored with a message. "
        "The current directory (the one from which you are "
        "invoking this program) will always be included implicitly, "
        "in addition to any directories that you specify.",
    )
    parser.add_argument(
        "-D",
        "--custom-data-path",
        action="append",
        nargs="?",
        const=".",
        default=[],
        help="Specify directories to search for custom data files. "
        "You can specify this argument multiple times. Once you specify "
        "a directory in this way, files located in the specified "
        "directory will be available in ProtocolContext.bundled_data. "
        "Note that bundle execution will still only allow data files in "
        "the bundle. If you specify this without a path, it will "
        "add the current path implicitly. If you do not specify this "
        "argument at all, no data files will be added. Any file in the "
        "specified paths will be loaded into memory and included in the "
        "bundle if --bundle is passed, so be careful that any directory "
        "you specify has only the files you want. It is usually a "
        "better idea to use -d so no files are accidentally included. "
        "Also note that data files are made available as their name, not "
        "their full path, so name them uniquely.",
    )
    parser.add_argument(
        "-s",
        "--custom-hardware-simulator-file",
        type=str,
        default=None,
        help="Specify a file that describes the features present in the "
        "hardware simulator. Features can be instruments, modules, and "
        "configuration.",
    )
    parser.add_argument(
        "-d",
        "--custom-data-file",
        action="append",
        default=[],
        help="Specify data files to be made available in "
        "ProtocolContext.bundled_data (and possibly bundled if --bundle "
        "is passed). Can be specified multiple times with different "
        "files. It is usually a better idea to use this than -D because "
        "there is less possibility of accidentally including something.",
    )
    if allow_bundle():
        parser = _get_bundle_args(parser)

    parser.add_argument(
        "-e",
        "--estimate-duration",
        action="store_true",
        # TODO (AL, 2021-07-26): Better wording.
        help="Estimate how long the protocol will take to complete."
        " This is an experimental feature.",
    )

    parser.add_argument(
        "protocol",
        metavar="PROTOCOL",
        type=argparse.FileType("rb"),
        help="The protocol file to simulate. If you pass '-', you can pipe "
        "the protocol via stdin; this could be useful if you want to use this "
        "utility as part of an automated workflow.",
    )
    parser.add_argument(
        "-v",
        "--version",
        action="version",
        version=f"%(prog)s {opentrons.__version__}",
        help="Print the opentrons package version and exit",
    )
    parser.add_argument(
        "-o",
        "--output",
        action="store",
        help="What to output during simulations",
        choices=["runlog", "nothing"],
        default="runlog",
    )
    return parser


def _get_bundle_dest(
    bundle_name: Optional[str], default_key: str, proto_name: str
) -> Optional[BinaryIO]:
    if bundle_name == default_key:
        protopath = pathlib.Path(proto_name)
        # strip all the suffixes since protocols are often named
        # .ot2.zip
        if protopath.name.endswith(".ot2.py"):
            protoname = pathlib.Path(protopath.stem).stem
        else:
            protoname = protopath.stem
        bundle_name = str((pathlib.Path.cwd() / protoname).with_suffix(".ot2.zip"))
        return open(bundle_name, "wb")
    elif bundle_name:
        return open(bundle_name, "wb")
    else:
        return None


# Note - this script is also set up as a setuptools entrypoint and thus does
# an absolute minimum of work since setuptools does something odd generating
# the scripts
def main() -> int:
    """Run the simulation"""
    parser = argparse.ArgumentParser(
        prog="opentrons_simulate", description="Simulate an OT-2 protocol"
    )
    parser = get_arguments(parser)

    args = parser.parse_args()
    # Try to migrate api v1 containers if needed

    # TODO(mm, 2022-12-01): Configure the DurationEstimator with the correct deck type.
    duration_estimator = DurationEstimator() if args.estimate_duration else None  # type: ignore[no-untyped-call]

    runlog, maybe_bundle = simulate(
        protocol_file=args.protocol,
        file_name=args.protocol.name,
        custom_labware_paths=args.custom_labware_path,
        custom_data_paths=(args.custom_data_path + args.custom_data_file),
        duration_estimator=duration_estimator,
        hardware_simulator_file_path=getattr(args, "custom_hardware_simulator_file"),
        log_level=args.log_level,
    )

    if maybe_bundle:
        bundle_name = getattr(args, "bundle", None)
        if bundle_name == args.protocol.name:
            raise RuntimeError("Bundle path and input path must be different")
        bundle_dest = _get_bundle_dest(
            bundle_name, "PROTOCOL.ot2.zip", args.protocol.name
        )
        if bundle_dest:
            bundle.create_bundle(maybe_bundle, bundle_dest)

    if args.output == "runlog":
        print(format_runlog(runlog))

    if duration_estimator:
        duration_seconds = duration_estimator.get_total_duration()
        hours = int(duration_seconds / 60 / 60)
        minutes = int((duration_seconds % (60 * 60)) / 60)
        print("--------------------------------------------------------------")
        print(f"Estimated protocol duration: {hours}h:{minutes}m")
        print("--------------------------------------------------------------")
        print("WARNING: Protocol duration estimation is an experimental feature")

    return 0


if __name__ == "__main__":
    sys.exit(main())
