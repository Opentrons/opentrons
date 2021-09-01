"""Errors raised by serial connection."""


class SerialException(Exception):
    """Base serial exception"""

    def __init__(self, port: str, description: str):
        super().__init__(f"{port}: {description}")
        self.port = port
        self.description = description


class NoResponse(SerialException):
    def __init__(self, port: str, command: str):
        super().__init__(port=port, description=f"No response to '{command}'")
        self.command = command


class FailedCommand(SerialException):
    def __init__(self, port: str, response: str):
        super().__init__(
            port=port, description=f"'Received error response '{response}'"
        )
        self.response = response


class AlarmResponse(FailedCommand):
    pass


class ErrorResponse(FailedCommand):
    pass
