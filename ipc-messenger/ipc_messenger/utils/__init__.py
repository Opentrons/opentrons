"""Util module"""

from inspect import signature, Parameter
from typing import Callable


def has_invalid_params(
    func: Callable,
    *args,
    **kwargs,
) -> bool:
    """Determine whether the arguments are valid for the given function."""
    # get functions required args
    params = signature(func).parameters
    required = [
        p for
        p in params.values() if
        p.kind is Parameter.POSITIONAL_OR_KEYWORD and
        p.default is p.empty
    ]

    # see if we have any missing args
    missing_args = set(required) - set(args)
    if len(missing_args) > 0:
        return True
    return False

