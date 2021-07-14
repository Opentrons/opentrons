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
        """Wait for the queue worker to be idle and ready to accept new commands.

        The worker is "idle" when:

        - There is no command currently executing
        - The worker is _not_ currently stopped

        This method should not raise, but if any unexepected exceptions
        happen during command execution that are not properly caught by
        the CommandExecutor, this is where they will be raised.
        """
        raise NotImplementedError("QueueWorker not yet implemented")
