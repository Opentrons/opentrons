"""Methods for saving and retrieving protocol files."""
from dataclasses import dataclass
from datetime import datetime
from logging import getLogger
from pathlib import Path
from typing import Dict, List

from opentrons.protocol_reader import ProtocolSource

log = getLogger(__name__)


@dataclass(frozen=True)
class ProtocolResource:
    """An entry in the protocol store, used to construct response models."""

    protocol_id: str
    created_at: datetime
    source: ProtocolSource


class ProtocolNotFoundError(KeyError):
    """Error raised when a protocol ID was not found in the store."""

    def __init__(self, protocol_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(f"Protocol {protocol_id} was not found.")


class ProtocolStore:
    """Methods for storing and retrieving protocol files."""

    def __init__(self, directory: Path) -> None:
        """Initialize the ProtocolStore.

        Arguments:
            directory: Directory in which to place created files.

            pre_analyzer: Called to extract basic info from protocols when they are
            `create()`ed.
        """
        self._directory = directory
        self._protocols_by_id: Dict[str, ProtocolResource] = {}

    def upsert(self, resource: ProtocolResource) -> None:
        """Upsert a protocol resource into the store."""
        self._protocols_by_id[resource.protocol_id] = resource

    def get(self, protocol_id: str) -> ProtocolResource:
        """Get a single protocol by ID."""
        try:
            return self._protocols_by_id[protocol_id]
        except KeyError as e:
            raise ProtocolNotFoundError(protocol_id) from e

    def get_all(self) -> List[ProtocolResource]:
        """Get all protocols currently saved in this store."""
        return list(self._protocols_by_id.values())

    def remove(self, protocol_id: str) -> ProtocolResource:
        """Remove a protocol from the store."""
        try:
            entry = self._protocols_by_id.pop(protocol_id)
        except KeyError as e:
            raise ProtocolNotFoundError(protocol_id) from e

        try:
            protocol_dir = entry.source.directory
            for file_path in entry.source.files:
                (protocol_dir / file_path.name).unlink()
            protocol_dir.rmdir()
        except Exception as e:
            log.warning(
                f"Unable to delete all files for protocol {protocol_id}",
                exc_info=e,
            )

        return entry
