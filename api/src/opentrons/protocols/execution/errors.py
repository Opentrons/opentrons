from types import TracebackType
from typing import Optional

from opentrons_shared_data.errors.exceptions import GeneralError


class ExceptionInProtocolError(GeneralError):
    """This exception wraps an exception that was raised from a protocol
    for proper error message formatting by the rpc, since it's only here that
    we can properly figure out formatting
    """

    def __init__(
        self,
        original_exc: Exception,
        original_tb: Optional[TracebackType],
        message: str,
        line: Optional[int],
    ) -> None:
        self.original_exc = original_exc
        self.original_tb = original_tb
        self.line = line
        super().__init__(
            wrapping=[original_exc],
            message=_build_message(
                exception_class_name=self.original_exc.__class__.__name__,
                line_number=self.line,
                message=message,
            ),
        )

    def __str__(self) -> str:
        return self.message


def _build_message(
    exception_class_name: str, line_number: Optional[int], message: str
) -> str:
    line_number_part = f" [line {line_number}]" if line_number is not None else ""
    return f"{exception_class_name}{line_number_part}: {message}"
