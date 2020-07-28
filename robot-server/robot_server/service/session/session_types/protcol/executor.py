import asyncio
from threading import Event, Thread

from opentrons import ThreadManager
from opentrons.hardware_control import ThreadedAsyncLock
from opentrons.protocols.parse import parse

from robot_server.service.protocol.protocol import UploadedProtocol
from robot_server.service.session.command_execution import CommandExecutor, \
    Command, CompletedCommand
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.session_types.protcol.models import \
    ProtocolSessionState


class ProtocolCommandExecutor(CommandExecutor):

    def __init__(self,
                 protocol: UploadedProtocol,
                 configuration: SessionConfiguration):
        """Constructor

        :param protocol: The protocol resource to use
        :param configuration: The session configuration
        """
        self._protocol = protocol
        self._configuration = configuration
        self._commands = []

    async def execute(self, command: Command) -> CompletedCommand:

        pass


class ProtocolRunner:
    PAUSABLE = {ProtocolSessionState.simulating, ProtocolSessionState.running}
    STARTABLE = {ProtocolSessionState.ready}
    RESUMABLE = {ProtocolSessionState.paused}

    def __init__(self,
                 protocol: UploadedProtocol,
                 hardware: ThreadManager,
                 motion_lock: ThreadedAsyncLock):
        self._pause_event = Event()
        self._state = ProtocolSessionState.idle
        self._pause_event = Event()
        self._worker_thread = Thread(target=self._run,
                                     args=(asyncio.get_event_loop(),))
        self._worker_thread.start()

    def _run(self, loop):
        """Worker thread entry point"""
        contents = self._protocol.get_contents()

        protocol = parse(contents,
                         filename=self._protocol.meta.protocol_file.path.stem,
                         extra_labware={})
        pass
