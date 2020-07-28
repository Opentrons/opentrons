from robot_server.service.protocol.protocol import UploadedProtocol
from robot_server.service.session.command_execution import CommandExecutor, \
    Command, CompletedCommand
from robot_server.service.session.configuration import SessionConfiguration


class ProtocolExecutor(CommandExecutor):

    def __init__(self,
                 protocol: UploadedProtocol,
                 configuration: SessionConfiguration):
        """Constructor

        :param protocol: The protocol resource to use
        :param configuration: The session configuration
        """
        self._protocol = protocol
        self._configuration = configuration

    async def execute(self, command: Command) -> CompletedCommand:
        pass


class

