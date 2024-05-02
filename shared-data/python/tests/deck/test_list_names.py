import pytest

from opentrons_shared_data.deck import list_names


@pytest.mark.parametrize("version", [3, 4])
def test_list_names(version: int) -> None:
    """Make sure `list_names()` returns something.

    Just a basic test to make sure it's not looking in a nonexistent directory or something.
    """
    assert len(list_names(version)) > 0
