import typing
import logging
from pathlib import Path

from fastapi import UploadFile

from robot_server.service.protocol.protocol import UploadedProtocol
from robot_server.service.protocol import errors
from robot_server.settings import get_settings

log = logging.getLogger(__name__)


class ProtocolManager:
    MAX_COUNT = get_settings().protocol_manager_max_protocols

    def __init__(self):
        self._protocols: typing.Dict[str, UploadedProtocol] = {}

    def create(
        self,
        protocol_file: UploadFile,
        support_files: typing.List[UploadFile],
    ) -> UploadedProtocol:
        """Create a protocol object from upload"""
        protocol_id = Path(protocol_file.filename).stem
        if protocol_id in self._protocols:
            raise errors.ProtocolAlreadyExistsException(
                f"A protocol with id '{protocol_id}' already exists"
            )

        if len(self._protocols) >= ProtocolManager.MAX_COUNT:
            raise errors.ProtocolUploadCountLimitReached(
                f"Upload limit of {ProtocolManager.MAX_COUNT} has " f"been reached."
            )

        new_protocol = UploadedProtocol.create(
            protocol_id=protocol_id,
            protocol_file=protocol_file,
            support_files=support_files,
        )
        log.debug(f"Created new protocol: {new_protocol.data}")

        self._protocols[new_protocol.data.identifier] = new_protocol
        return new_protocol

    def get(self, protocol_id: str) -> UploadedProtocol:
        """Get a protocol"""
        try:
            return self._protocols[protocol_id]
        except KeyError:
            raise errors.ProtocolNotFoundException(protocol_id)

    def get_all(self) -> typing.Tuple[UploadedProtocol, ...]:
        """Get all the protocols"""
        return tuple(self._protocols.values())

    def remove(self, protocol_id: str) -> UploadedProtocol:
        """Remove a protocol"""
        try:
            proto = self._protocols.pop(protocol_id)
            proto.clean_up()
            return proto
        except KeyError:
            raise errors.ProtocolNotFoundException(protocol_id)

    def remove_all(self) -> typing.Tuple[UploadedProtocol, ...]:
        """Remove all protocols"""
        for p in self._protocols.values():
            try:
                p.clean_up()
            except IOError:
                log.exception(f"Failed to remove protocol {p.data.identifier}")
        ret_val = tuple(self._protocols.values())
        self._protocols = {}
        return ret_val
