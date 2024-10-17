"""Tests for the APIs around liquid classes."""
import pytest
from opentrons import simulate


@pytest.mark.ot2_only
def test_liquid_class_creation_and_property_fetching() -> None:
    """It should create the liquid class and provide access to its properties."""
    protocol_context = simulate.get_protocol_api(version="2.20", robot_type="OT-2")
    pipette_left = protocol_context.load_instrument("p20_single_gen2", mount="left")
    pipette_right = protocol_context.load_instrument("p300_multi", mount="right")
    tiprack = protocol_context.load_labware("opentrons_96_tiprack_20ul", "1")

    glycerol_50 = protocol_context.define_liquid_class("fixture_glycerol50")

    assert glycerol_50.name == "fixture_glycerol50"
    assert glycerol_50.display_name == "Glycerol 50%"
    assert (
        glycerol_50.get_for(
            pipette_left.name, tiprack.load_name
        ).dispense.flowRateByVolume["default"]
        == 50
    )
    assert (
        glycerol_50.get_for(
            pipette_left.name, tiprack.load_name
        ).aspirate.submerge.speed
        == 100
    )

    with pytest.raises(ValueError):
        glycerol_50.get_for(pipette_right.name, tiprack.load_name)

    with pytest.raises(AttributeError):
        glycerol_50.name = "foo"  # type: ignore

    with pytest.raises(AttributeError):
        glycerol_50.display_name = "bar"  # type: ignore
