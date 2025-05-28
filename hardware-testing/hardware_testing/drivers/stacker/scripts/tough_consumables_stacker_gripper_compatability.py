from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.module_contexts import FlexStackerContext

metadata = {
    "protocolName": "Flex Stacker Gripper Labware Lid Test",
    "author": "Carlos F",
    "description": "This protocol tests labware compatibility with the Flex Stacker",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}

labware_library = {
    1:"opentrons_tough_1_reservoir_300ml",
    2:"opentrons_tough_4_reservoir_72ml",
    3:"opentrons_tough_12_reservoir_22ml", 
    4:"opentrons_tough_universal_lid",
}
labware_name = labware_library[2]
deck_slots = ["D3", "D1", "C2", "B3"]
CYCLES = 1

LID_COUNT = 1
LID_DEFINITION = "opentrons_tough_universal_lid"
LID_BOTTOM_DEFINITION = "opentrons_tough_universal_lid"
DECK_RISER_NAME = "opentrons_flex_deck_riser"

def run(protocol: ProtocolContext) -> None:
    # f_stacker_1: FlexStackerContext = protocol.load_module("flexStackerModuleV1", "B3")

    # f_stacker_1.set_stored_labware(
    #     load_name=labware_name,
    #     count=4,
    #     lid=None
    #     if "opentrons_flex_96_tiprack" in labware_name
    #     else None,
    # )

    # labware = []
    # for i in range(CYCLES):
    #     # Unload Labware
    #     for j, slot in enumerate(deck_slots):
    #         print(f"\nCycle: {i+1}, Unload: #{j+1}\n")
    #         labware.append(f_stacker_1.retrieve())
    #         protocol.move_labware(labware[j], slot, use_gripper=True)
    #     # Load Labware
    #     for j, slot in enumerate(deck_slots):
    #         print(f"\nCycle: {i+1}, Load: #{j+1}\n")
    #         protocol.move_labware(labware[j], f_stacker_1, use_gripper=True)
    #         f_stacker_1.store()

    lid = protocol.load_lid_stack(LID_DEFINITION, "D1", LID_COUNT )
    lids = []
    for i in range(LID_COUNT - 2):
        lids.append(lids[-1].load_labware(LID_DEFINITION))
    lids.reverse()  # NOTE: reversing to more easily loop through lids from top-to-bottom
    i = 0
    for i in range(4):
        protocol.move_lid(
            lid,
            "D2",
            use_gripper=True,
        )