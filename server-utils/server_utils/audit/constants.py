"""Constants for system generated audit log messages."""

from typing import Final

MESSAGE_ROBOT_BOOT: Final = "Robot started up"
MESSAGE_LOG_PERIOD_END: Final = "Log period ended"
MESSAGE_LOG_PERIOD_START: Final = "Log period begun"
MESSAGE_NO_PREVIOUS_PERIOD: Final = "There was no previous log period saved. Either this is the first time this robot has booted or the previous log period was deleted."
MESSAGE_NO_PREVIOUS_LOG: Final = (
    "There was no previous log message. A log message has been deleted."
)
MESSAGE_LOG_SIGNING_UNAVAILABLE: Final = "Log signing is unavailable: "

ACTION_ROBOT_BOOT: Final = "robot-boot"
ACTION_LOG_PERIOD_START: Final = "log-period-begin"
ACTION_LOG_PERIOD_END: Final = "log-period-end"
ACTION_LOG_LOGGING_ERROR: Final = "log-error"
ACTION_UNSIGNED_RUNS_WARNING: Final = "unsigned-runs-warning"
ACTION_ROBOT_VERSION: Final = "robot-version"
ACTION_STORE_RUNLOG: Final = "store-runlog"

ACCOUNT_NAME_SYSTEM: Final = "system"
LEGAL_NAME_SYSTEM: Final = ""
