"""Types for log message storage."""

from dataclasses import dataclass

from audit_server.log_storage.models import UserLogForExport


@dataclass
class StoredLog:
    """Arguments required for storing a log message."""

    message: str
    message_hash: str
    message_sig: str
    sig_version: str


@dataclass
class RobotLogPaths:
    """Robot Log Entry information to be exported."""

    file_path: str
    file_hash: str
    file_sig: str
    file_sig_version: str


@dataclass
class LogPeriodEntries:
    """Entries associated with a particular log period."""

    user_log: UserLogForExport
    robot_log_entries: list[RobotLogPaths]
