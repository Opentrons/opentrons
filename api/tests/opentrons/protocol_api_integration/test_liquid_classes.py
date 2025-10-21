"""Tests for the APIs around liquid classes."""
from typing import Dict, Any

import pytest

from opentrons.protocol_api import ProtocolContext
from opentrons_shared_data.liquid_classes.types import TransferPropertiesDict


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_liquid_class_creation_and_property_fetching(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should create the liquid class and provide access to its properties."""
    pipette_load_name = "flex_8channel_50"
    p50 = simulated_protocol_context.load_instrument(pipette_load_name, mount="left")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    water = simulated_protocol_context.get_liquid_class("water")

    assert water.name == "water"
    assert water.display_name == "Aqueous"

    # TODO (spp, 2024-10-17): update this to fetch pipette load name from instrument context
    assert (
        water.get_for(p50, tiprack).dispense.flow_rate_by_volume.get_for_volume(1) == 50
    )
    assert water.get_for(pipette_load_name, tiprack.uri).aspirate.submerge.speed == 100

    with pytest.raises(
        ValueError,
        match="No properties found for non-existent-pipette in water liquid class",
    ):
        water.get_for("non-existent-pipette", tiprack.uri)

    with pytest.raises(AttributeError):
        water.name = "foo"  # type: ignore

    with pytest.raises(AttributeError):
        water.display_name = "bar"  # type: ignore

    with pytest.raises(ValueError, match="Liquid class definition not found"):
        simulated_protocol_context.get_liquid_class("non-existent-liquid")


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_custom_liquid_class_creation_and_property_fetching(
    simulated_protocol_context: ProtocolContext,
    minimal_transfer_properties_dict: Dict[str, Dict[str, TransferPropertiesDict]],
) -> None:
    """It should create the liquid class and provide access to its properties."""
    pipette_load_name = "flex_1channel_50"
    p50 = simulated_protocol_context.load_instrument(pipette_load_name, mount="left")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    custom_water = simulated_protocol_context.define_liquid_class(
        name="water_50",
        properties=minimal_transfer_properties_dict,
        display_name="Custom Aqueous",
    )
    custom_water_props = custom_water.get_for(p50, tiprack)
    assert custom_water_props.aspirate.submerge.speed == 100
    assert custom_water_props.dispense.flow_rate_by_volume.get_for_volume(20) == 30

    with pytest.raises(
        ValueError,
        match="No properties found for flex_8channel_50 in water_50 liquid class",
    ):
        custom_water.get_for(
            "flex_8channel_50", "opentrons/opentrons_flex_96_tiprack_50ul/1"
        )


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_custom_liquid_class_w_multi_dispense_creation_and_property_fetching(
    simulated_protocol_context: ProtocolContext,
    custom_pip_n_tip_transfer_properties_dict_v2: Dict[str, Dict[str, Any]],
) -> None:
    """It should create the liquid class with specified properties and provide access to its properties."""
    p50 = "a_custom_pipette_type"
    tiprack = "a_custom_tiprack_uri"
    custom_water = simulated_protocol_context.define_liquid_class(
        name="water_50",
        properties=custom_pip_n_tip_transfer_properties_dict_v2,
        display_name="Custom Aqueous",
    )

    assert custom_water.name == "water_50"
    assert custom_water.display_name == "Custom Aqueous"
    custom_water_props = custom_water.get_for(p50, tiprack)
    assert custom_water_props.aspirate.retract.speed == 40
    assert custom_water_props.dispense.submerge.speed == 100
    assert custom_water_props.multi_dispense.retract.blowout.location.value == "trash"  # type: ignore[union-attr]

    with pytest.raises(
        ValueError,
        match="No properties found for flex_8channel_50 in water_50 liquid class",
    ):
        custom_water.get_for(
            "flex_8channel_50", "opentrons/opentrons_flex_96_tiprack_50ul/1"
        )
