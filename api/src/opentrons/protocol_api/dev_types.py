try:
    from typing_extensions import Protocol
except ModuleNotFoundError:
    Protocol = None  # type: ignore

# this file defines types that require dev dependencies
# and are only relevant for static typechecking.
#
#  - code should be written so that this file can fail to import
#  - or the things defined in here can be None at execution time
#  - only types that match the above criteria should be put here
#  - please include this file as close to a leaf as possible

if Protocol is not None:
    class Dictable(Protocol):
        """ A protocol defining the _asdict interface to
        classes generated from typing.NamedTuple, which cannot
        be used as a type annotation because it is a type ctor
        not a type (https://github.com/python/mypy/issues/3915)
        """
        async def _asdict(self):
            ...
