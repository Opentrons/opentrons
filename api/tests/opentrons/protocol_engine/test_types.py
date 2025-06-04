"""Test protocol engine types."""

import pytest
from pydantic import ValidationError, BaseModel

from opentrons.protocol_engine.types import (
    HexColor,
    SimulatedProbeResult,
    LiquidTrackingType,
    WellInfoSummary,
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


def test_fails_deser_wrong_string() -> None:
    """Should fail to deserialize the wrong string."""
    with pytest.raises(ValidationError):
        _TestModel.model_validate_json('{"value": "not the right string"}')


@pytest.mark.parametrize("height", [None, 10.0, SimulatedProbeResult()])
def test_roundtrips_well_info_summary(height: LiquidTrackingType | None) -> None:
    """It should round trip a WellInfoSummary."""
    inp = WellInfoSummary(
        labware_id="hi",
        well_name="lo",
        loaded_volume=None,
        probed_height=height,
        probed_volume=height,
    )
    outp = WellInfoSummary.model_validate_json(inp.model_dump_json())
    if isinstance(height, SimulatedProbeResult):
        assert outp.labware_id == inp.labware_id
        assert outp.well_name == inp.well_name
        assert isinstance(outp.probed_height, SimulatedProbeResult)
        assert isinstance(outp.probed_volume, SimulatedProbeResult)
    else:
        assert outp == inp


@pytest.mark.parametrize("op_1", [SimulatedProbeResult(), 100.0, -5])
@pytest.mark.parametrize("op_2", [SimulatedProbeResult(), 100.0, -5])
def test_simulated_probe_result_operand_math(
    op_1: LiquidTrackingType, op_2: LiquidTrackingType
) -> None:
    """Ensure that math operators can be used with SimulatedProbeResult."""
    _error = None
    r: LiquidTrackingType | None = None
    try:
        r = op_1 + op_2
        r = op_1 - op_2
        r = op_1 / op_2
        r = op_1 * op_2
        r = op_1**op_2
        r = op_1 // op_2
        r = op_1 % op_2
        r = op_1 < op_2
        r = op_1 > op_2
        r = op_1 >= op_2
        r = op_1 <= op_2
        r = op_1 == op_2
    except Exception as _e:
        _error = _e
    assert _error is None
    assert r is not None
