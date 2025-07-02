from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.module_contexts import (
    FlexStackerContext,
)

metadata = {
    "protocolName": "Stacker and Gripper Demo",
    "author": "lol",
    "source": "Protocol Library"
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}

def run(protocol: ProtocolContext) -> None:
    # Load the stacker module on D row (let's use D4 for the stacker base)
    stacker_50_1: FlexStackerContext = protocol.load_module(
        "flexStackerModuleV1", "D4"
    )  # type: ignore[assignment]
    stacker_50_1.set_stored_labware(
        load_name="opentrons_flex_96_tiprack_50ul",
        lid="opentrons_flex_tiprack_lid",
        count=6,
    )
    TRASH = protocol.load_waste_chute()


    # Define the slots for dispensing and moving tipracks
    move_order   = ["D1", "C1", "C2", "C3", "A2", "B3"]    

    # Move the tiprack to each slot in the specified order using the gripper
    
    for _ in range(6):
        tipracks = []
        for slot in move_order:
            tiprack = stacker_50_1.retrieve()
            protocol.move_labware(
                tiprack,
                slot,
                use_gripper=True
            )
            protocol.comment(f"Moved unique tiprack to {slot} using gripper.")
            tipracks.append((tiprack))

        # Move the tipracks back to the stacker in the same order
        for tiprack in tipracks:
            protocol.move_labware(
                tiprack,
                stacker_50_1,
                use_gripper=True
            )
            stacker_50_1.store()
            protocol.comment(f"Returned tiprack to stacker.")


