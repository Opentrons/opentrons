"""Unit tests for the `get_union_elements` module."""


import typing

import pytest

from opentrons.util.get_union_elements import get_union_elements


@pytest.mark.parametrize(
    ("input", "expected_output"),
    [
        (typing.Union[int, str, float], (int, str, float)),
        (
            typing.Annotated[typing.Union[int, str, float], "top-level annotation"],
            (int, str, float),  # The Annotated should be stripped.
        ),
        (
            typing.Annotated[
                typing.Union[int, typing.Annotated[str, "element annotation"], float],
                "top-level annotation",
            ],
            # The top-level Annotated should be stripped, but the element-level
            # Annotated should be left alone.
            (int, typing.Annotated[str, "element annotation"], float),
        ),
    ],
)
def test_get_union_elemements(
    input: typing.Any, expected_output: tuple[typing.Any, ...]
) -> None:
    """Check valid inputs to `get_union_elements()`."""
    assert get_union_elements(input) == expected_output


@pytest.mark.parametrize(
    "invalid_input",
    [
        "foo",  # not a type
        str,  # not a union
    ],
)
def test_get_union_elemements_raises_on_invalid_input(
    invalid_input: typing.Any,
) -> None:
    """Make sure invalid `get_union_elements()` inputs always raise a TypeError."""
    with pytest.raises(TypeError):
        get_union_elements(invalid_input)
