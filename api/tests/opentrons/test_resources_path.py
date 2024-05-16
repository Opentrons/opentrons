"""Unit tests for opentrons._resources_path."""


from opentrons._resources_path import RESOURCES_PATH


def test_resources_path() -> None:
    """Make sure the resource path is basically accessible."""
    matches = list(RESOURCES_PATH.glob("smoothie-*"))
    assert matches
