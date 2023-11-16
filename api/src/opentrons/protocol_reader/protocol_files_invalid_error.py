# noqa: D100
from opentrons_shared_data.errors.exceptions import InvalidProtocolData


class ProtocolFilesInvalidError(InvalidProtocolData):
    """Raised when the input to a ProtocolReader is not a well-formed protocol."""
