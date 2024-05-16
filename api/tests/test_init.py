"""Tests for the top-level __init__.py."""

import pytest

from opentrons.protocols.types import ApiDeprecationError


def test_legacy_imports() -> None:
    """Certain imports should raise ApiDeprecationErrors."""
    with pytest.raises(ApiDeprecationError):
        from opentrons import robot  # noqa: F401

    with pytest.raises(ApiDeprecationError):
        from opentrons import reset  # noqa: F401

    with pytest.raises(ApiDeprecationError):
        from opentrons import instruments  # noqa: F401

    with pytest.raises(ApiDeprecationError):
        from opentrons import containers  # noqa: F401

    with pytest.raises(ApiDeprecationError):
        from opentrons import labware  # noqa: F401

    with pytest.raises(ApiDeprecationError):
        from opentrons import modules  # noqa: F401
