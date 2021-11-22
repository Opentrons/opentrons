"""Protocol file reading interfaces."""

from .protocol_reader import ProtocolReader, ProtocolFilesInvalidError
from .protocol_source import (
    ProtocolSource,
    ProtocolSourceFile,
    ProtocolFileRole,
    ProtocolType,
    JsonProtocolConfig,
    PythonProtocolConfig,
)

__all__ = [
    # main interface
    "ProtocolReader",
    # errors
    "ProtocolFilesInvalidError",
    # values and types
    "ProtocolSource",
    "ProtocolSourceFile",
    "ProtocolFileRole",
    "ProtocolType",
    "JsonProtocolConfig",
    "PythonProtocolConfig",
]
