""" Utilities for the legacy wrapper """
import functools
import inspect
import logging
from typing import Callable


def log_call(
        logger: logging.Logger) -> Callable[[Callable], Callable]:

    @functools.wraps(log_call)
    def _decorator(f: Callable) -> Callable:

        @functools.wraps(f)
        def _wrapper(*args, **kwargs):
            call_args = inspect.Signature.from_callable(f).bind(
                *args, **kwargs)
            logger.info(str(call_args))
            return f(*args, **kwargs)

        return _wrapper

    return _decorator
