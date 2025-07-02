from opentrons.protocol_api import ProtocolContext

metadata = {
    "protocolName": "Stacker and Gripper Demo",
    "author": "GitHub Copilot lol",
    "apiLevel": "2.23",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}

def run(protocol: ProtocolContext) -> None:
    # Load the stacker module on D row (let's use D3 for the stacker base)
    stacker = protocol.load_module("stacker", "D3")
    
    # Define the slots for dispensing and moving tipracks
    stacker_dispense_slot = "D4"
    move_order = ["D1", "D2", "C1", "C2", "A2", "B3"]

    # Dispense a 96 tiprack from the stacker to D4
    tiprack = stacker.dispense_labware(
        labware_name="opentrons_flex_96_tiprack_200ul",
        location=stacker_dispense_slot
    )

    protocol.comment("Dispensed tiprack to D4 from stacker.")

    # Move the tiprack to each slot in the specified order using the gripper
    current_slot = stacker_dispense_slot
    for dest_slot in move_order:
        protocol.move_labware(
            labware=tiprack,
            new_location=dest_slot,
            use_gripper=True
        )
        protocol.comment(f"Moved tiprack from {current_slot} to {dest_slot} using gripper.")
        current_slot