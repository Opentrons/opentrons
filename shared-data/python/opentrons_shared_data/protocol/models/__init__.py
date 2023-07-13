"""Protocol file reading interfaces."""
from . import protocol_schema_v6, protocol_schema_v7
from .protocol_schema_v6 import ProtocolSchemaV6
from .protocol_schema_v7 import ProtocolSchemaV7

__all__ = [
    "ProtocolSchemaV6",
    "protocol_schema_v6",
    "ProtocolSchemaV7",
    "protocol_schema_v7"
]
