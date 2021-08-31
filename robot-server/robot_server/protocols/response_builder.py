"""Protocol response model factory."""
from .protocol_store import ProtocolResource
from .protocol_models import Protocol, Metadata


class ResponseBuilder:
    """Interface to construct protocol resource models from data."""

    @staticmethod
    def build(protocol_entry: ProtocolResource) -> Protocol:
        """Build a protocol resource model.

        Arguments:
            entry: Protocol data from the ProtocolStore.

        Returns:
            Protocol model representing the resource.
        """
        return Protocol(
            id=protocol_entry.protocol_id,
            protocolType=protocol_entry.protocol_type,
            protocolMetadata=Metadata.parse_obj(protocol_entry.protocol_metadata),
            createdAt=protocol_entry.created_at,
        )
