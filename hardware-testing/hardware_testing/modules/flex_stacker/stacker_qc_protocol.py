"""PVT Flex Stacker QC."""
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.protocol_api.module_contexts import (
    FlexStackerContext,
)

metadata = {
    "protocolName": "Flex Stacker PVT QC",
    "author": "Opentrons <protocols@opentrons.com>",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.25",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    parameters.add_str(
        variable_name="stacker_slot",
        display_name="Flex Stacker Slot",
        description="The slot where the Flex Stacker is loaded.",
        default="D4",
        choices=[
            {"display_name": "A4", "value": "A4"},
            {"display_name": "B4", "value": "B4"},
            {"display_name": "C4", "value": "C4"},
            {"display_name": "D4", "value": "D4"},
        ],
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    # ======================= SIMPLE SETUP ARRANGEMENT ======================
    # STACKERS
    stacker: FlexStackerContext = protocol.load_module(
        "flexStackerModuleV1",
        protocol.params.stacker_slot,  # type: ignore[attr-defined]
    )  # type: ignore[assignment]
    stacker.set_stored_labware(
        load_name="opentrons_flex_96_tiprack_200ul",
        count=6,
        lid="opentrons_flex_tiprack_lid",
    )

    SLOTS = ["C1", "C2", "C3", "D1", "D2", "D3"]

    # ======================= RETRIEVE/STORE TIPRACKS ======================
    tipracks = []
    for slot in SLOTS:
        tiprack = stacker.retrieve()
        protocol.move_labware(tiprack, slot, use_gripper=True)
        tipracks.append(tiprack)

    for tiprack in tipracks:
        protocol.move_labware(tiprack, stacker, use_gripper=True)
        stacker.store()

    # =================== FILL STACKERS WITH PCR PLATES ======================

    stacker.empty("Empty all tipracks from the hopper and load in 6 PCR plates.")
    stacker.set_stored_labware(
        load_name="opentrons_96_wellplate_200ul_pcr_full_skirt",
        count=6,
    )

    # ======================= RETRIEVE/STORE PCR PLATES ======================
    plates = []
    for slot in SLOTS:
        plate = stacker.retrieve()
        protocol.move_labware(plate, slot, use_gripper=True)
        plates.append(plate)

    for plate in plates:
        protocol.move_labware(plate, stacker, use_gripper=True)
        stacker.store()

    # =================== FILL STACKERS WITH 384 wells PLATES ======================

    stacker.empty("Empty all PCR plates from the hopper and load in 6 384 plates.")
    stacker.set_stored_labware(
        load_name="biorad_384_wellplate_50ul",
        count=6,
    )

    # ======================= RETRIEVE/STORE 384 wells PLATES ======================
    plates = []
    for slot in SLOTS:
        plate = stacker.retrieve()
        protocol.move_labware(plate, slot, use_gripper=True)
        plates.append(plate)

    for plate in plates:
        protocol.move_labware(plate, stacker, use_gripper=True)
        stacker.store()
