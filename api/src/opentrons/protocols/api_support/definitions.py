from .types import APIVersion

MAX_SUPPORTED_VERSION = APIVersion(2, 12)
"""The maximum supported protocol API version in this release."""

POST_V1_MODULE_DEF_VERSION = APIVersion(2, 3)
"""The first API version in which we prefer the non-V1 module definitions."""

MIN_SUPPORTED_VERSION = APIVersion(2, 0)
"""The minimum supported protocol API version in this release."""
