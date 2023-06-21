"""A python package implementing the errors in errors.json.

A note on this package: it is not codegenned but written by hand, and has to be upkept
by hand. It comes with tests to make sure this happens.

This seems a little ridiculous and kind of is, but what it lets us do is really simplify
our static analysis and dev setup.
"""

from .categories import ErrorCategories, ErrorCategory
from .codes import ErrorCodes, ErrorCode
from .exceptions import (
    EnumeratedError,
    PythonException,
    GeneralError,
    RoboticsControlError,
    RoboticsInteractionError,
)

__all__ = [
    "ErrorCategory",
    "ErrorCategories",
    "ErrorCode",
    "ErrorCodes",
    "EnumeratedError",
    "PythonException",
    "GeneralError",
    "RoboticsControlError",
    "RoboticsInteractionError",
]
