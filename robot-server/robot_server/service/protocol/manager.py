import typing

from robot_server.service.protocol.protocol import UploadedProtocol


class ProtocolManager:
    def __init__(self):
        self._protocols: typing.Dict[str, UploadedProtocol] = {}

