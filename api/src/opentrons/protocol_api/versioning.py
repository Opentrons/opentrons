from __future__ import annotations

import functools
from typing import Any, Callable, NamedTuple, TypeVar, cast
from typing_extensions import Protocol


class APIVersion(NamedTuple):
    major: int
    minor: int

    @classmethod
    def from_string(cls, inp: str) -> APIVersion:
        parts = inp.split(".")
        if len(parts) != 2:
            raise ValueError(inp)
        intparts = [int(p) for p in parts]

        return cls(major=intparts[0], minor=intparts[1])

    def __str__(self) -> str:
        return f"{self.major}.{self.minor}"


MAX_SUPPORTED_VERSION = APIVersion(2, 13)
"""The maximum supported Python Protocol API version in this release."""

MIN_SUPPORTED_VERSION = APIVersion(2, 0)
"""The minimum supported Python Protocol API version in this release."""


class APIVersionError(ValueError):
    """A Protocol API method was called, but requires a higher API version."""


class HasAPIVersion(Protocol):
    """A Protocol API object with a declared API version in use."""

    _api_version: APIVersion


FuncT = TypeVar("FuncT", bound=Callable[..., Any])


def requires_version(major: int, minor: int) -> Callable[[FuncT], FuncT]:
    """Decorate a Protocol API method to require a minimum API version.

    The class holding the decorated method must adhere
    to the shape of `HasAPIVersion`.
    """
    added_version = APIVersion(major, minor)

    def _wrapper(decorated_method: FuncT) -> FuncT:
        if hasattr(decorated_method, "__doc__"):
            # Add the versionadded stanza to everything decorated if we can
            docstr = decorated_method.__doc__ or ""

            # this newline and initial space has to be there for sphinx to
            # parse this correctly and not add it into for instance a
            # previous code-block
            decorated_method.__doc__ = (
                f"{docstr}\n\n        .. versionadded:: {added_version}\n\n"
            )

        @functools.wraps(decorated_method)
        def _check_version(*args: Any, **kwargs: Any) -> Any:
            self_arg: HasAPIVersion = args[0]

            if self_arg._api_version >= added_version:
                return decorated_method(*args, **kwargs)

            raise APIVersionError(
                f"{decorated_method.__qualname__} was added in {added_version},"
                f" but your protocol requested API version {self_arg._api_version}."
                f" You must increase your API version to {self_arg._api_version}"
                " to use this functionality."
            )

        return cast(FuncT, _check_version)

    return _wrapper
