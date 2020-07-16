import typing
import logging
from pathlib import Path

from fastapi import UploadFile

from robot_server.service.protocol.protocol import UploadedProtocol
from robot_server.service.protocol import errors


log = logging.getLogger(__name__)


class ProtocolManager:
    def __init__(self):
        self._protocols: typing.Dict[str, UploadedProtocol] = {}

    def create(self, protocol_file: UploadFile) -> UploadedProtocol:
        """Create a protocol object from upload"""
        name = Path(protocol_file.filename).stem
        if name in self._protocols:
            raise errors.ProtocolAlreadyExistsException(
                f"A protocol named {name} already exists"
            )

        try:
            new_protocol = UploadedProtocol(protocol_file)
            log.debug(f"Created new protocol: {new_protocol.meta}")
        except (TypeError, IOError) as e:
            log.exception("Failed to create protocol")
            raise errors.ProtocolIOException(str(e))

        self._protocols[new_protocol.meta.name] = new_protocol
        return new_protocol

    def get(self, name: str) -> UploadedProtocol:
        """Get a protocol"""
        try:
            return self._protocols[name]
        except KeyError:
            raise errors.ProtocolNotFoundException(name)

    def get_all(self) -> typing.Iterable[UploadedProtocol]:
        """Get all the protocols"""
        return self._protocols.values()

    def remove(self, name: str) -> UploadedProtocol:
        """Remove a protocol"""
        try:
            return self._protocols.pop(name)
        except KeyError:
            raise errors.ProtocolNotFoundException(name)
