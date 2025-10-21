"""Map errors to Exceptions."""
from opentrons_shared_data.errors import EnumeratedError, PythonException


def map_unexpected_error(error: BaseException) -> EnumeratedError:
    """Map an unhandled Exception to a known exception."""
    if isinstance(error, EnumeratedError):
        return error
    else:
        return PythonException(error)
