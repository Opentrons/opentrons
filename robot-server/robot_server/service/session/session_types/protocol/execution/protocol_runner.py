import asyncio
import logging
import os
import sys
import typing

from opentrons.broker import Broker
from opentrons.commands import command_types
from opentrons.hardware_control import ThreadedAsyncLock, ThreadManager
from opentrons.api.session import Session as ApiProtocolSession

from robot_server.service.protocol.protocol import UploadedProtocol


log = logging.getLogger(__name__)


class CancelledException(Exception):
    pass


ListenerType = typing.Callable[[typing.Dict], None]


class ProtocolRunner:
    """A class that runs an UploadedProtocol.

    Protocols are run and simulated synchronously. A listener callback can
    be provided for inspecting and control flow of the protocol execution."""

    def __init__(self,
                 protocol: UploadedProtocol,
                 loop: asyncio.AbstractEventLoop,
                 hardware: ThreadManager,
                 motion_lock: ThreadedAsyncLock,
                 ):
        """Constructor"""
        self._protocol = protocol
        self._loop = loop
        self._hardware = hardware
        self._motion_lock = motion_lock
        self._session: typing.Optional[ApiProtocolSession] = None
        self._broker = Broker()
        self._broker.subscribe(command_types.COMMAND, self._on_command)
        self._listeners: typing.List[ListenerType] = []

    def add_listener(self, listener: ListenerType):
        """Add a command listener"""
        self._listeners.append(listener)

    def remove_listener(self, listener: ListenerType):
        """Remove a command listener"""
        self._listeners.remove(listener)

    def load(self):
        """Create and simulate the api protocol session"""
        with ProtocolRunnerContext(self._protocol):
            self._session = ApiProtocolSession.build_and_prep(
                name=self._protocol.meta.protocol_file.path.name,
                contents=self._protocol.get_contents(),
                hardware=self._hardware,
                loop=self._loop,
                broker=self._broker,
                motion_lock=self._motion_lock,
                # TODO Amit 8/3/2020 - need an answer for custom labware
                extra_labware={})

    def run(self):
        """Run the protocol"""
        with ProtocolRunnerContext(self._protocol):
            self._session.run()

    def simulate(self):
        """Simulate the protocol"""
        with ProtocolRunnerContext(self._protocol):
            self._session.refresh()

    def _on_command(self, msg):
        """Dispatch the events"""
        for listener in self._listeners:
            listener(msg)


class ProtocolRunnerContext:
    def __init__(self, protocol: UploadedProtocol):
        self._protocol = protocol
        self._cwd = None

    def __enter__(self):
        self._cwd = os.getcwd()
        # Change working directory to temp dir
        os.chdir(self._protocol.meta.directory.name)
        # Add temp dir to path
        sys.path.append(self._protocol.meta.directory.name)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Undo working directory and path modifications
        os.chdir(self._cwd)
        sys.path.remove(self._protocol.meta.directory.name)
