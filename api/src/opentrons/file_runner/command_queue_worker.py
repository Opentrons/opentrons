"""CommandQueueWorker definition. Implements JSON protocol flow control."""


class CommandQueueWorker:
    """A class that executes the queued commands in a ProtocolEngine."""

    def play(self) -> None:
        """Start/resume queued command execution."""
        raise NotImplementedError()

    def pause(self) -> None:
        """Pause queued command execution."""
        raise NotImplementedError()

    def stop(self) -> None:
        """Stop queued command execution."""
        raise NotImplementedError()
