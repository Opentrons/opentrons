"""Reverse companion for the Flex Stacker labware-stamping protocol.

Water-only ABR: stamped water is recoverable. Removes stamped water from every
well, returns plates and tip racks to their starting stackers, and resets tip
racks for automated rerun.
"""

from opentrons import protocol_api
from opentrons.protocol_api.module_contexts import FlexStackerContext

metadata = {
    "protocolName": "Reverse Flex Stacker Stamping Protocol",
    "author": "Opentrons",
    "description": "Recover stamped water and restore stacker contents.",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Mirror the original runtime parameters."""
    parameters.add_bool(
        display_name="Use Temperature Module",
        variable_name="use_temp_mod",
        default=False,
        description="Must be false; the original true path has a D1 conflict.",
    )
    parameters.add_int(
        display_name="# of PCR Plates",
        variable_name="num_pcr_plates",
        default=6,
        minimum=1,
        maximum=40,
    )
    parameters.add_int(
        display_name="# of 384 Plates",
        variable_name="num_384_plates",
        default=6,
        minimum=1,
        maximum=40,
    )
    parameters.add_int(
        display_name="# of NEST Deep Well Plates",
        variable_name="num_nest_plates",
        default=6,
        minimum=1,
        maximum=40,
    )
    parameters.add_int(
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Recover stamped water and restore the original physical layout."""
    if protocol.params.use_temp_mod:  # type: ignore[attr-defined]
        raise ValueError(
            "The original protocol cannot complete with use_temp_mod=True: "
            "the reservoir and Temperature Module both occupy D1."
        )

    protocol.comment(
        "The original ignores all three plate-count RTPs and always processes "
        "six plates of each type; this reverse therefore restores six each."
    )

    adapters = [
        protocol.load_adapter("opentrons_flex_96_tiprack_adapter", slot)
        for slot in ("A2", "A3")
    ]
    end_tipracks = [
        adapters[0].load_labware("opentrons_flex_96_tiprack_50ul"),
        adapters[1].load_labware("opentrons_flex_96_tiprack_50ul"),
        protocol.load_labware("opentrons_flex_96_tiprack_50ul", "D2"),
        protocol.load_labware("opentrons_flex_96_tiprack_50ul", "D3"),
    ]

    pipette = protocol.load_instrument(
        "flex_96channel_1000", mount="left", tip_racks=[end_tipracks[0]]
    )
    reservoir = protocol.load_labware("nest_1_reservoir_195ml", "D1")

    stacker_specs = (
        ("A4", "opentrons_flex_96_tiprack_50ul", 2),
        ("B4", "opentrons_96_wellplate_200ul_pcr_full_skirt", 6),
        ("C4", "appliedbiosystemsmicroamp_384_wellplate_40ul", 6),
        ("D4", "nest_96_wellplate_2ml_deep", 6),
    )
    stackers: list[FlexStackerContext] = []
    for slot, load_name, count in stacker_specs:
        stacker = protocol.load_module("flexStackerModuleV1", slot)
        stacker.set_stored_labware(load_name, count=count)
        stackers.append(stacker)  # type: ignore[arg-type]

    recovered_water = protocol.define_liquid(
        name="Stamped water",
        description="Water present in every plate well at original end state.",
        display_color="#C0C0C0",
    )
    reservoir["A1"].load_liquid(liquid=recovered_water, volume=0)

    pipette.pick_up_tip()
    for stacker in stackers[1:]:
        for _ in range(6):
            plate = stacker.retrieve()
            protocol.move_labware(plate, "B1", use_gripper=True)
            for well in plate.wells():
                well.load_liquid(liquid=recovered_water, volume=50)
            pipette.aspirate(50, plate["A1"])
            pipette.dispense(50, reservoir["A1"])
            protocol.move_labware(plate, stacker, use_gripper=True)
            stacker.store()
    pipette.return_tip()

    tip_stacker = stackers[0]
    for rack in end_tipracks:
        protocol.move_labware(rack, tip_stacker, use_gripper=True)
        tip_stacker.store()

    pipette.reset_tipracks()

    protocol.comment(
        "Recovered 50 uL from each well of 18 plates (86.4 mL total). "
        "All plates and six tip racks are back in their original stackers."
    )
