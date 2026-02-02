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

    class StrEnum(str, Enum):  # type: ignore[no-redef]
        """Replacement for 3.11 style StrEnum in <3.11."""

        def __format__(self, spec: str) -> str:
            """Build an fstring without the enumerator class name."""
            return str.__format__(str(self.name), spec)


__all__ = ["StrEnum"]
