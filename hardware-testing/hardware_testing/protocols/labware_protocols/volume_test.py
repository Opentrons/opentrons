"""inner-well-geometry-creator Protocol."""

from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
    Labware,
    LiquidClass,
)

metadata = {
    "protocolName": "volume tester",
    "author": "abr",
}   

LIQUID_MOUNT = "right"
LIQUID_PIPETTE_SIZE = 1000
LIQUID_TIP_SIZE = 1000
RESERVOIR = "nest_1_reservoir_195ml"

PROBING_MOUNT = "left"
PROBING_TIP_SIZE = 50
PROBING_PIPETTE_SIZE = 50

SLOT_LIQUID_TIPRACK = "C3"
SLOT_PROBING_TIPRACK = "D3"
SLOT_LABWARE = "D2"
SLOT_RESERVOIR = "C2"

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

def run(ctx: ProtocolContext) -> None:

    #labware_type = ctx.parameters.labware_type

    labware = ctx.load_labware("nest_96_wellplate_2ml_deep", "D2")
    volumes = [270, 349.392, 580.50075, 840.92899, 936.24185]

    #pipettes
    liquid_pip_name = f"flex_1channel_{LIQUID_PIPETTE_SIZE}"
    probing_pip_name = f"flex_1channel_{PROBING_PIPETTE_SIZE}"

    #tipracks 
    liquid_rack = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{LIQUID_TIP_SIZE}uL", SLOT_LIQUID_TIPRACK
    )
    probing_rack = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{PROBING_TIP_SIZE}uL", SLOT_PROBING_TIPRACK
    )

    #load pipettes w tipracks 
    liq_pipette = ctx.load_instrument(
        liquid_pip_name, LIQUID_MOUNT, tip_racks=[liquid_rack]
    )
    probe_pipette = ctx.load_instrument(
        probing_pip_name, PROBING_MOUNT, tip_racks=[probing_rack]
    )

    for volume in volumes:
        height = labware["A1"].height_from_volume(volume)
        ctx.comment(
    f"height = {height} at volume {volume},"
    
    )
    labware.load_empty(labware.wells())
    src = ctx.load_labware(RESERVOIR, SLOT_RESERVOIR)
    ctx.load_trash_bin("A3")

    #liquid classing
    ethanol_liq = ctx.define_liquid("Ethanol", display_color="#FFFFC5")
    src["A1"].load_liquid(ethanol_liq, src["A1"].max_volume - 1000)
    ethanol = ctx.get_liquid_class("ethanol_80")
    lm = "liquid-meniscus"
    props = ethanol.get_for(liq_pipette, liquid_rack)
    meniscus_z = -0.5
    props.aspirate.aspirate_position.position_reference = lm
    props.aspirate.aspirate_position.offset.z = meniscus_z
    props.dispense.dispense_position.position_reference = lm
    props.dispense.dispense_position.offset.z = meniscus_z


    