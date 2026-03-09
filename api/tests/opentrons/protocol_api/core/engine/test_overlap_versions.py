"""Test the tip overlap selection logic in the API core."""

import pytest

from ... import versions_at_or_above, versions_below
from opentrons.protocol_api.core.engine.overlap_versions import overlap_for_api_version
from opentrons.protocols.api_support.types import APIVersion


@pytest.mark.parametrize(
    "api_version", versions_below(APIVersion(2, 19), flex_only=False)
)
def test_all_below_219_use_v0(api_version: APIVersion) -> None:
    """Versions below 2.19 should use v0."""
    assert overlap_for_api_version(api_version) == "v0"


@pytest.mark.parametrize("api_version", versions_at_or_above(APIVersion(2, 19)))
def test_above_219_below_220_use_v1(api_version: APIVersion) -> None:
    """Versions above 2.19 and below 2.20 should use v1."""
    if api_version in versions_below(APIVersion(2, 20), flex_only=False):
        assert overlap_for_api_version(api_version) == "v1"


@pytest.mark.parametrize("api_version", versions_at_or_above(APIVersion(2, 20)))
def test_above_220_use_v3(api_version: APIVersion) -> None:
    """Versions above 2.20 should use v3."""
    assert overlap_for_api_version(api_version) == "v3"


def test_future_api_version_uses_v3() -> None:
    """Future versions should use v3."""
    assert overlap_for_api_version(APIVersion(2, 99)) == "v3"
