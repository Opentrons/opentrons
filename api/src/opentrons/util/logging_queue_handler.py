# noqa: D100


import logging.handlers
import logging
from queue import Queue
from typing import cast
from typing_extensions import override


class CustomQueueHandler(logging.handlers.QueueHandler):
    """A logging.QueueHandler with some customizations.

    - Allow adding `extra` data to handled log records.

    - Simplify and optimize for single-process use.

    - If a new message comes in but the queue is full, block until it has room.
      (The default QueueHandler drops records in a way we probably wouldn't notice.)
    """

    def __init__(
        self, *, queue: Queue[logging.LogRecord], extra: dict[str, object] | None = None
    ) -> None:
        """Construct the handler.

        Args:
            queue: When this handler receives a log record, it will insert the message
                into this queue.
            extra: Extra data to attach to each log record, to be interpreted by
                whatever handler is on the consuming side of the queue. e.g. if that's
                `systemd.journal.JournalHandler`, you could add a "SYSLOG_IDENTIFIER"
                key here. This corresponds to the `extra` arg of `Logger.debug()`.
        """
        super().__init__(queue=queue)

        # Double underscore because we're subclassing external code so we should try to
        # avoid collisions with its attributes.
        self.__extra = extra

    @override
    def prepare(self, record: logging.LogRecord) -> logging.LogRecord:
        """Called internally by the superclass before enqueueing a record."""
        if self.__extra is not None:
            # This looks questionable, but updating __dict__ is the documented behavior
            # of `Logger.debug(msg, extra=...)`.
            record.__dict__.update(self.__extra)

        # We intentionally do *not* call `super().prepare(record)`. It's documented to
        # muck with the data in the LogRecord, apparently as part of supporting
        # inter-process use. Since we don't need that, we can preserve the original
        # data and also save some compute time.
        return record

    @override
    def enqueue(self, record: logging.LogRecord) -> None:
        """Called internally by the superclass to enqueue a record."""
        # This cast is safe because we constrain the type of `self.queue`
        # in our `__init__()` and nobody should mutate it after-the-fact, in practice.
        queue = cast(Queue[logging.LogRecord], self.queue)
        queue.put(record)
