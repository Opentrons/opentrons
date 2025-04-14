import logging.handlers
import logging
from queue import Queue
from typing import cast
from typing_extensions import override


class CustomQueueHandler(logging.handlers.QueueHandler):
    """A logging.QueueHandler with some customizations.

    - Allow extra
    - Do not mangle records
    - Block
    """

    def __init__(
        self, *, queue: Queue[logging.LogRecord], syslog_identifier: str | None = None
    ) -> None:
        super().__init__(queue=queue)
        # Double underscore because we're subclassing external code so we should try to
        # avoid collisions with its attributes.
        self.__syslog_identifier = syslog_identifier

    @override
    def prepare(self, record: logging.LogRecord) -> logging.LogRecord:
        """
        - Allow extra
        - Do not mangle records
        """
        if self.__syslog_identifier is not None:
            record.__dict__.setdefault("SYSLOG_IDENTIFIER", self.__syslog_identifier)
        return record

    @override
    def enqueue(self, record: logging.LogRecord) -> None:
        # This cast is safe because we constrain the type of self.queue
        # in our __init__() and nobody should mutate it after-the-fact, in practice.
        queue = cast(Queue[logging.LogRecord], self.queue)
        queue.put(record)
