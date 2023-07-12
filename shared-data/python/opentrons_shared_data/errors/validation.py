from .exceptions import EnumeratedError
from .codes import ErrorCodes


def code_in_exception_stack(exc: EnumeratedError, code: ErrorCodes) -> bool:
    if hasattr(exc, "original_error"):
        return any(
            code.value.code == wrapped_error.errorCode
            for wrapped_error in exc.original_error.wrappedErrors
        )
    else:
        return any(code == wrapped_error.code for wrapped_error in exc.wrapping)
