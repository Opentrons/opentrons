"""Cross-package utilities."""

# Python 3.11 changed the string serialization of string based enums
# to always include the enumerator name; it previously did not. This
# is more consistent but also breaks our usage of string based enums.
# The replacement class StrEnum has the old behavior, but it's not
# available below 3.11. Here's a polyfill that makes it all better.
try:
    from enum import StrEnum
except ImportError:
    from enum import Enum

    class StrEnum(str, Enum):
        def __format__(self, spec) -> str:
            return str.__format__(str(self.name), spec)


__all__ = ["StrEnum"]
