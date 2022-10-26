"""Test protocol engine types."""
import pytest
from pydantic import ValidationError

from opentrons.protocol_engine.types import HexColor


@pytest.mark.parametrize("hex_color", ["#F00", "#FFCC00CC", "#FC0C", "#98e2d1"])
def test_hex_validation(hex_color: str) -> None:
    """Should allow creating a HexColor."""
    # make sure noting is raised when instantiating this class
    assert HexColor(__root__=hex_color)


def test_handles_invalid_hex() -> None:
    """Should raise a validation error."""
    with pytest.raises(ValidationError):
        HexColor(__root__="#123456789")
