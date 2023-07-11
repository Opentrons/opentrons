"""Driver errors for collecting all the pokemon."""


class CommunicationError(RuntimeError):
    """There was an error in communications with a device."""

    def __init__(self, exc: BaseException) -> None:
        """Build an exception for easier catching that wraps another."""
        self.wrapped_exc = exc


class USBCommunicationError(CommunicationError):
    """There was an error in communications with a USB device."""


class CANCommunicationError(CommunicationError):
    """There was an error in communications with a canbus device."""
