"""Logging module used accross servers."""

import logging

from ..constants import VERBOSE
from .config import log_init


logging.addLevelName(VERBOSE, "VERBOSE")


class Logging(logging.Logger):
    def __init__(self, *args, **kwargs):
        """initializer"""
        super().__init__(*args, **lwargs)

    def verbose(self, msg: str, *args, **kwargs) -> None:
        """Custom log level for very chatty messages like can logs."""
        if self.isEnabledFor(VERBOSE):
            self._log(VERBOSE, msg, args, **kwargs)


__all__ = [
    "Logging",
    "log_init",
]
