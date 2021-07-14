"""Command queue execution worker module."""


class QueueWorker:
    """Handle and track execution of commands queued in ProtocolEngine state."""

    def start(self) -> None:
        """Start executing commands in the queue."""
        raise NotImplementedError("QueueWorker not yet implemented")

    def stop(self) -> None:
        """Stop executing commands in the queue."""
        raise NotImplementedError("QueueWorker not yet implemented")

    async def wait_for_idle(self) -> None:
        """Wait for the queue worker to become idle.

        - There is no command currently executing
        - There are no commands queued according to
          `state_view.commands.get_next_queued()`

        This method should not raise, but if any unexepected exceptions
        happen during command execution that are not properly caught by
        the CommandExecutor, this is where they will be raised.
        """
        raise NotImplementedError("QueueWorker not yet implemented")
