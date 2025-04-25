"""Test protocol engine types."""

import pytest
from pydantic import ValidationError, BaseModel

from opentrons.protocol_engine.types import (
    HexColor,
    SimulatedProbeResult,
    LiquidTrackingType,
)


@pytest.mark.parametrize("hex_color", ["#F00", "#FFCC00CC", "#FC0C", "#98e2d1"])
def test_hex_validation(hex_color: str) -> None:
    """Should allow creating a HexColor."""
    # make sure noting is raised when instantiating this class
    assert HexColor(hex_color)
    assert HexColor.model_validate_json(f'"{hex_color}"')


@pytest.mark.parametrize("invalid_hex_color", ["true", "null", "#123456789"])
def test_handles_invalid_hex(invalid_hex_color: str) -> None:
    """Should raise a validation error."""
    with pytest.raises(ValidationError):
        HexColor(invalid_hex_color)
    with pytest.raises(ValidationError):
        HexColor.model_validate_json(f'"{invalid_hex_color}"')


class _TestModel(BaseModel):
    """Test model for deserializing SimulatedProbeResults."""

    value: LiquidTrackingType


def test_roundtrips_simulated_liquid_probe() -> None:
    """Should be able to roundtrip our simulated results."""
    base = _TestModel(value=SimulatedProbeResult())
    serialized = base.model_dump_json()
    deserialized = _TestModel.model_validate_json(serialized)
    assert isinstance(deserialized.value, SimulatedProbeResult)


def test_roundtrips_nonsimulated_liquid_probe() -> None:
    """Should be able to roundtrip our simulated results."""
    base = _TestModel(value=10.0)
    serialized = base.model_dump_json()
    deserialized = _TestModel.model_validate_json(serialized)
    assert deserialized.value == 10.0
