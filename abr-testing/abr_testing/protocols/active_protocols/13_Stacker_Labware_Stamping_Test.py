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

from typing import List

metadata = {
    "protocolName": "Flex Stacker Stamping Protocol NOABRFOLDER",
    "author": "Rhyann Clarke <rhyann.clarke@opentrons.com",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}


DECK_SLOTS = ["A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D2", "D3"]
TIP_RACK_SLOTS = DECK_SLOTS[:2]
LABWARE_SLOTS = DECK_SLOTS[2:]


def set_liquid_class_behavior(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tip_racks: List[Labware],
    water: LiquidClass,
) -> None:
    """Set Liquid Class Behavior."""
    lm = "liquid-meniscus"
    for lbw in tip_racks:
        props = water.get_for(pipette, lbw)
        props.aspirate.aspirate_position.position_reference = lm  # type: ignore[assignment]
        props.aspirate.aspirate_position.offset.z = -2
        props.dispense.dispense_position.position_reference = lm  # type: ignore[assignment]
        props.dispense.dispense_position.offset.z = 1


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    parameters.add_bool(
        display_name="Use Temperature Module",
        variable_name="use_temp_mod",
        default=False,
        description="Use temperature module in protocol.",
    )
    parameters.add_int(
        display_name="# of PCR Plates",
        variable_name="num_pcr_plates",
        default=6,
        maximum=40,
        minimum=1,
    )
    parameters.add_int(
        display_name="# of 384 Plates",
        variable_name="num_384_plates",
        default=6,
        maximum=40,
        minimum=1,
    )
    parameters.add_int(
        display_name="# of NEST Deep Well Plates",
        variable_name="num_nest_plates",
        default=6,
        maximum=40,
        minimum=1,
    )


def move_plates_to_deck_fill_and_store(
    stacker: FlexStackerContext,
    ctx: ProtocolContext,
    p96: InstrumentContext,
    water: LiquidClass,
    reservoir: Labware,
) -> None:
    """Move plates to the deck, fill them with water, and store back in stacker."""
    # Move PCR Plates and Fill
    plates_on_deck = []
    ctx.capture_image(filename="move_plates")

    for i in range(6):
        plate = stacker.retrieve()
        ctx.move_labware(plate, LABWARE_SLOTS[i], use_gripper=True)
        plate.load_empty(plate.wells())
        if i % 2 == 0:
            p96.reset_tipracks()
            set_liquid_class_behavior(ctx, p96, p96.tip_racks, water)
        p96.transfer_with_liquid_class(
            water,
            50,
            reservoir["A1"],
            plate["A1"],
            new_tip="once",
            return_tip=True,
            group_wells=False,
        )
        plates_on_deck.append(plate)
    for plate in plates_on_deck:
        ctx.move_labware(plate, stacker, use_gripper=True)
        stacker.store()


def unload_tipracks_from_stacker(
    ctx: ProtocolContext,
    p96: InstrumentContext,
    stacker: FlexStackerContext,
    tiprack_adapters: List[Labware],
) -> None:
    """Unload tipracks and assign to pipette."""
    ctx.capture_image(filename="unload_tipracks")

    p96.tip_racks.clear()
    for i in range(2):
        tip_rack = stacker.retrieve()
        ctx.move_labware(tip_rack, tiprack_adapters[i], use_gripper=True)
        # 🔁 Liquid class must be configured *after* tip rack is on deck
        water = ctx.get_liquid_class("water")
        set_liquid_class_behavior(ctx, p96, [tip_rack], water)
        p96.tip_racks.append(tip_rack)


def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    ctx.capture_image(filename="start_of_run")
    use_temp_mod = ctx.params.use_temp_mod  # type: ignore[attr-defined]

    if not ctx.is_simulating():
        ctx.comment("Protocol Version: 03")

    tiprack_adapters = [
        ctx.load_adapter("opentrons_flex_96_tiprack_adapter", slot)
        for slot in TIP_RACK_SLOTS
    ]
    # Load Instrument and Liquids
    p96: InstrumentContext = ctx.load_instrument(
        "flex_96channel_1000",
        mount="left",
        tip_racks=[],
    )
    reservoir = ctx.load_labware("nest_1_reservoir_195ml", "D1")
    water_liq = ctx.define_liquid("water", "#C0C0C0")
    reservoir["A1"].load_liquid(water_liq, 10000)
    
    if use_temp_mod:
        temp_mod: TemperatureModuleContext = ctx.load_module(
            "temperaturModuleV1", "D1"
        )  # type: ignore[assignment]
        temp_mod.set_temperature(4)
        DECK_SLOTS.remove("D1")
        
    stackers = []
    
    # Use tuples for labware name and count
    labware_dict = {
        "A4": ("opentrons_flex_96_tiprack_50ul", 6),
        "B4": (
            "opentrons_96_wellplate_200ul_pcr_full_skirt",
            ctx.params.num_pcr_plates,  # type: ignore[attr-defined]
        ),
        "C4": (
            "appliedbiosystemsmicroamp_384_wellplate_40ul",
            ctx.params.num_384_plates,  # type: ignore[attr-defined]
        ),
        "D4": (
            "nest_96_wellplate_2ml_deep",
            ctx.params.num_nest_plates,  # type: ignore[attr-defined]
        ),
    }
    
    try:
        for slot, (labware_name, count) in labware_dict.items():
            stacker: FlexStackerContext = ctx.load_module(
                "flexStackerModuleV1",
                slot,
            )  # type: ignore[assignment]
            stacker.set_stored_labware(labware_name, count=count)
            stackers.append(stacker)
            
        stacker_50ul = stackers[0]
        stacker_pcrplates = stackers[1]
        stacker_384plates = stackers[2]
        stacker_nest96deep = stackers[3]
        water = ctx.get_liquid_class("water")
        ctx.load_trash_bin("A1")
        
        # unload tipracks
        unload_tipracks_from_stacker(ctx, p96, stacker_50ul, tiprack_adapters)
        move_plates_to_deck_fill_and_store(
            stacker_pcrplates, ctx, p96, water, reservoir
        )
        
        # Move old tipracks
        old_tipracks = p96.tip_racks
        ctx.move_labware(old_tipracks[0], "D2", use_gripper=True)
        ctx.move_labware(old_tipracks[1], "D3", use_gripper=True)
        
        # Get new tipracks
        unload_tipracks_from_stacker(ctx, p96, stacker_50ul, tiprack_adapters)
        
        # Second labware
        move_plates_to_deck_fill_and_store(
            stacker_384plates, ctx, p96, water, reservoir
        )

        # Unload last tip racks
        unused_tiprack1 = stacker_50ul.retrieve()
        ctx.move_labware(unused_tiprack1, "B1", use_gripper=True)
        unused_tiprack2 = stacker_50ul.retrieve()
        ctx.move_labware(unused_tiprack2, "B2", use_gripper=True)

        # Store extra tip racks
        for tip in p96.tip_racks:
            ctx.move_labware(tip, stacker_50ul, use_gripper=True)
            stacker_50ul.store()
            
        # Move Tip racks to adapters
        ctx.move_labware(unused_tiprack1, tiprack_adapters[0], use_gripper=True)
        ctx.move_labware(unused_tiprack2, tiprack_adapters[1], use_gripper=True)

        # Next Labware Type
        p96.tip_racks.clear()
        p96.tip_racks.append(unused_tiprack1)
        p96.tip_racks.append(unused_tiprack2)
        set_liquid_class_behavior(ctx, p96, [unused_tiprack1, unused_tiprack2], water)
        move_plates_to_deck_fill_and_store(
            stacker_nest96deep, ctx, p96, water, reservoir
        )
        
        ctx.capture_image(filename="end_of_run")

    except Exception as e:
        raise (e)
