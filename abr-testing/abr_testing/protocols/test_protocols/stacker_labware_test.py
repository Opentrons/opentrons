"""Labware Stamping Protocol."""
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Labware,
    LiquidClass,
)
from opentrons.protocol_api.module_contexts import (
    FlexStackerContext,
    TemperatureModuleContext,
)


metadata = {
    "protocolName": "Flex Stacker Stress Test",
    "author": "Rhyann Clarke <rhyann.clarke@opentrons.com",
}

requirements = {"robotType": "Flex", "apiLevel": "2.25"}


def set_liquid_class_behavior(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tip_rack: Labware,
    water: LiquidClass,
) -> None:
    """Set Liquid Class Behavior."""
    lm = "liquid-meniscus"
    props = water.get_for(pipette, tip_rack)
    props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
    props.aspirate.aspirate_position.offset.z = -2
    props.dispense.dispense_position.position_reference = lm  # type: ignore[assignment]
    props.dispense.dispense_position.offset.z = 1
    pipette.tip_racks = [tip_rack]


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    slots = ["A4", "B4", "C4", "D4"]
    for i in range(4):
        parameters.add_str(
            display_name=f"Stacker {i+1} Location",
            variable_name=f"stacker_{i+1}_location",
            default=slots[i],
            description=f"Location of stacker {i+1}.",
            choices=[
                {"display_name": "A4", "value": "A4"},
                {"display_name": "B4", "value": "B4"},
                {"display_name": "C4", "value": "C4"},
                {"display_name": "D4", "value": "D4"},
                {"display_name": "None", "value": "none"},
            ],
        )
    parameters.add_bool(
        display_name="Use Temperature Module",
        variable_name="use_temp_mod",
        default=False,
        description="Use temperature module in protocol.",
    )


def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    stacker_1 = ctx.params.stacker_1_location  # type: ignore[attr-defined]
    stacker_2 = ctx.params.stacker_2_location  # type: ignore[attr-defined]
    stacker_3 = ctx.params.stacker_3_location  # type: ignore[attr-defined]
    stacker_4 = ctx.params.stacker_4_location  # type: ignore[attr-defined]
    use_temp_mod = ctx.params.use_temp_mod  # type: ignore[attr-defined]
    stacker_locations = [stacker_1, stacker_2, stacker_3, stacker_4]
    deck_slots = ["A1", "A2", "B1", "B2", "B3", "C1", "C2", "C3", "D1",  "D3"]
    tip_rack_slots = deck_slots[:2]  # Slots for tip racks
    labware_slots = deck_slots[6:]
    tiprack_adapters = [
        ctx.load_adapter("opentrons_flex_96_tiprack_adapter", slot)
        for slot in tip_rack_slots
    ]
    # Load Instrument and Liquids
    p96: InstrumentContext = ctx.load_instrument(
        "flex_96channel_1000",
        mount="left",
        tip_racks=[],
    )
    reservoir = ctx.load_labware("nest_1_reservoir_195ml", "D2")
    water_liq = ctx.define_liquid("water", "#C0C0C0")
    reservoir["A1"].load_liquid(water_liq, 10000)
    if use_temp_mod:
        temp_mod: TemperatureModuleContext = ctx.load_module(
            "temperaturModuleV1", "D1"
        )  # type: ignore[assignment]
        temp_mod.set_temperature(4)
        deck_slots.remove("D1")
    stackers = []
    labware = [
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "appliedbiosystemsmicroamp_384_wellplate_40ul",
        "nest_96_wellplate_2ml_deep",
    ]
    for i, location in enumerate(stacker_locations):
        if location == "none":
            continue
        stacker: FlexStackerContext = ctx.load_module(
            "flexStackerModuleV1",
            location,
        )  # type: ignore[assignment]
        if i == 0:
            stacker.set_stored_labware(
                "opentrons_flex_96_tiprack_50ul",
                count=6,
            )
        else:
            stacker.set_stored_labware(labware[i - 1], count=6)
        stackers.append(stacker)
    stacker_50ul = stackers[0]
    stacker_prcplates = stackers[1]
    water = ctx.get_liquid_class("water")
    ctx.load_trash_bin("A3")
    pcr_on_deck = []
    for i in range(4):
        tip_rack = stacker_50ul.retrieve()
        set_liquid_class_behavior(ctx, p96, tip_rack, water)
        ctx.move_labware(tip_rack, tiprack_adapters[i], use_gripper=True)
        pcr_plate = stacker_prcplates.retrieve()
        if use_temp_mod:
            ctx.move_labware(pcr_plate, temp_mod, use_gripper=True)
        else:
            ctx.move_labware(pcr_plate, labware_slots[i], use_gripper=True)
        pcr_plate.load_empty(pcr_plate.wells())
        print(i)
        p96.transfer_with_liquid_class(
            water,
            45,
            reservoir["A1"],
            pcr_plate["A1"],
            new_tip="once",
            return_tip=True,
            group_wells = False
        )
        pcr_on_deck.append(pcr_plate)
        
