"""Types for log message storage."""

from dataclasses import dataclass


@dataclass
class StoredLog:
    """Arguments required for storing a log message."""

    message: str
    message_hash: str
    message_sig: str
    sig_version: str
