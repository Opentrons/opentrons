from enum import Enum


class LogIdentifier(str, Enum):
    """Identifier of the log"""
    api = "api.log"
    serial = "serial.log"


class LogFormat(str, Enum):
    """Format to use for log records"""
    text = "text"
    json = "json"
