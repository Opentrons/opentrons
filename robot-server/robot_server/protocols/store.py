"""Methods for saving and retrieving protocol files."""
from fastapi import UploadFile
from typing import List, Sequence

from .models import ProtocolResource


class ProtocolStoreKeyError(RuntimeError):
    """The referenced protocol ID was not found in the store."""

    pass


class ProtocolStore:
    """Methods for storing and retrieving protocol files."""

    @staticmethod
    def get_all_protocols() -> List[ProtocolResource]:
        """Get all protocols currently saved in the system."""
        raise NotImplementedError()

    @staticmethod
    def get_protocol(id: str) -> ProtocolResource:
        """Get a single protocol by ID."""
        raise NotImplementedError()

    @staticmethod
    def add_protocol(files: Sequence[UploadFile]) -> ProtocolResource:
        """Add a protocol to the store."""
        raise NotImplementedError()

    @staticmethod
    def remove_protocol(id: str) -> ProtocolResource:
        """Remove a protocol from the store."""
        raise NotImplementedError()
