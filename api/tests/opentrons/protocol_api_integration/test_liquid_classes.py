"""Tests for the APIs around liquid classes."""
import pytest
from decoy import Decoy
from opentrons_shared_data.robot.types import RobotTypeEnum

from opentrons import simulate
from opentrons.config import feature_flags as ff


@pytest.mark.ot2_only
def test_liquid_class_creation_and_property_fetching(
    decoy: Decoy, mock_feature_flags: None
) -> None:
    """It should create the liquid class and provide access to its properties."""
    decoy.when(ff.allow_liquid_classes(RobotTypeEnum.OT2)).then_return(True)
    protocol_context = simulate.get_protocol_api(version="2.20", robot_type="OT-2")
    pipette_left = protocol_context.load_instrument("p20_single_gen2", mount="left")
    pipette_right = protocol_context.load_instrument("p300_multi", mount="right")
    tiprack = protocol_context.load_labware("opentrons_96_tiprack_20ul", "1")

    glycerol_50 = protocol_context.define_liquid_class("fixture_glycerol50")

    assert glycerol_50.name == "fixture_glycerol50"
    assert glycerol_50.display_name == "Glycerol 50%"

    # TODO (spp, 2024-10-17): update this to use pipette's load name instead of pipette.name
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

    with pytest.raises(
        ValueError,
        match="No properties found for p300_multi in fixture_glycerol50 liquid class",
    ):
        glycerol_50.get_for(pipette_right.name, tiprack.load_name)

    with pytest.raises(AttributeError):
        glycerol_50.name = "foo"  # type: ignore

    with pytest.raises(AttributeError):
        glycerol_50.display_name = "bar"  # type: ignore

    with pytest.raises(ValueError, match="Liquid class definition not found"):
        protocol_context.define_liquid_class("non-existent-liquid")


def test_liquid_class_feature_flag() -> None:
    """It should raise a not implemented error without the allowLiquidClass flag set."""
    protocol_context = simulate.get_protocol_api(version="2.20", robot_type="OT-2")
    with pytest.raises(NotImplementedError):
        protocol_context.define_liquid_class("fixture_glycerol50")
