"""Models for /system/logs endpoints."""

import logging
from enum import StrEnum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class LogIdentifier(StrEnum):
    """Identifier of the log."""

    api = "api.log"
    serial = "serial.log"
    api_server = "combined_api_server.log"
    update_server = "update_server.log"
    can = "can_bus.log"
    server = "server.log"
    kernel = "kernel.log"
    auth = "auth_server.log"
    audit = "audit_server.log"
    remote_access = "remote_access.log"
    touchscreen = "touchscreen.log"


class LogFormat(StrEnum):
    """Format to use for log records."""

    text = "text"
    json = "json"


class LogLevels(StrEnum):
    """Valid log levels."""

    _level_id: int

    def __new__(cls, value: str, level: int) -> "LogLevels":
        """Construct a log level enum member with its logging lib id."""
        # https://docs.python.org/3/library/enum.html#when-to-use-new-vs-init
        obj = str.__new__(cls, value)
        obj._value_ = value
        obj._level_id = level
        return obj

    debug = ("debug", logging.DEBUG)
    info = ("info", logging.INFO)
    warning = ("warning", logging.WARNING)
    error = ("error", logging.ERROR)

    @property
    def level_id(self) -> int:
        """The log level id as defined in logging lib."""
        return self._level_id


class LogLevel(BaseModel):
    """Request body for setting the local log level."""

    log_level: Optional[LogLevels] = Field(
        None, description="The value to set (conforming to Python log levels)"
    )

    @field_validator("log_level", mode="before")
    @classmethod
    def lower_case_log_keys(cls, value: object) -> object:
        """Normalize log level strings to lowercase."""
        if value is None:
            return value
        else:
            # This `type: ignore[call-arg]` is because mypy thinks there needs to be
            # a second arg here for the int level, but there does not.
            return LogLevels(  # type: ignore[call-arg]
                # todo(mm, 2025-03-18): We probably do actually need to check that
                # the value is a str before calling .lower() on it.
                value.lower(),  # type: ignore[attr-defined]
            )
