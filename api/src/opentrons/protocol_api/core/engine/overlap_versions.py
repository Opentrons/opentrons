"""Mappings between API versions and overlap versions."""
from functools import lru_cache
from typing_extensions import Final
from opentrons.protocols.api_support.types import APIVersion

_OVERLAP_VERSION_MAP: Final = {
    APIVersion(2, 0): "v0",
    APIVersion(2, 19): "v1",
    APIVersion(2, 20): "v3",
}


@lru_cache(1)
def overlap_for_api_version(api_version: APIVersion) -> str:
    """Get the overlap version for a specific API version."""
    defined = list(reversed(sorted(_OVERLAP_VERSION_MAP.keys())))
    for version in defined:
        if version <= api_version:
            return _OVERLAP_VERSION_MAP[version]
    return _OVERLAP_VERSION_MAP[APIVersion(2, 0)]
