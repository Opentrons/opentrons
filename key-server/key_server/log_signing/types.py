class LogSigningError(Exception):
    """An error during log signing."""

    pass


class LogSigningRequestError(LogSigningError):
    """An error during log signing because of bad request data."""

    pass


class LogSigningInternalError(LogSigningError):
    """An error during log signing for internal reasons."""

    pass
