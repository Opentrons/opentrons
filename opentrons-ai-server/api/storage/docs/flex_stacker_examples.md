# Flex stacker examples

##  Example 1: Only uses 2 stackers but replaces the tip boxes back into the empty stacker

```python
import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Test",
    "created": "2025-08-12T14:22:28.078Z",
    "lastModified": "2025-08-12T14:26:50.898Z"
}

requirements = {"robotType": "Flex", "apiLevel": "2.25"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    well_plate_1 = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",
        location="B2",
        namespace="opentrons",
        version=3,
    )
    reservoir_1 = protocol.load_labware(
        "nest_12_reservoir_15ml",
        location="A1",
        namespace="opentrons",
        version=2,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument(
        "flex_8channel_1000", "left", tip_racks=[],
    )

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Buffer",
        display_color="#b925ff",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=[
            "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8",
            "A9", "A10", "A11", "A12"
        ],
        liquid=liquid_1,
        volume=10000,
    )


    # Load Stacking Area:
    # Loads a Stacker Module, ("item name", "position, A4-D4")
    stacker_1 = protocol.load_module("flexStackerModuleV1", "A4")
    stacker_2 = protocol.load_module("flexStackerModuleV1", "B4")
    # Loads labware into the Stacker, ("item name", "count", "lid")
    # Item name = Labware, stackers can have only 1 type
    # Count = depends on labware, can fit max 6 opentrons tipracks, ~12 deepwells, etc
    # lid = opentrons tipracks require lids in order to be stacked.
    # Gripper cannot move labware with lid on it, it has to first discard/move the lid
    stacker_1.set_stored_labware("opentrons_flex_96_tiprack_200ul", count=6, lid="opentrons_flex_tiprack_lid")
    stacker_2.set_stored_labware("opentrons_flex_96_tiprack_200ul", count=0)
    # Loading a tiprack on the moveable shuttle, Position "A4-D4"
    # Does not have to match the labware in the stacker (example putting a p50 tiprack on the shuttle of a p200 tiprack stacker)
    # Labware has to be cleared before using the stacker
    tiprack_50 = stacker_1.load_labware('opentrons_flex_96_tiprack_50ul')

    # PROTOCOL STEPS

    # MOVING: tiprack_50 = stacker_200_A4 --> A3
    protocol.move_labware(labware=tiprack_50,new_location='A3',use_gripper=True)

    def replace_tip_rack():
        tiprack = stacker_1.retrieve() # This is pulling the tiprack down from the stacker
        protocol.move_lid(tiprack, waste_chute, use_gripper=True)
        # MOVING: tiprack --> B1
        protocol.move_labware(labware=tiprack,new_location='B1',use_gripper=True)
        return tiprack 

    # # This is pulling the first tiprack from the stacker and placing it on the shuttle which is located at A4 

    tiprack_200_1 = replace_tip_rack()
    # tiprack_200_1 = stacker_1.retrieve()
    # protocol.move_lid(tiprack_200_1, waste_chute, use_gripper=True)
    # # MOVING: tiprack_200_1 = stacker_200_A4 --> B1
    # protocol.move_labware(labware=tiprack_200_1,new_location='B1',use_gripper=True)

    for i in range(12):
        pipette_left.pick_up_tip(tiprack_200_1)
        pipette_left.aspirate(100, reservoir_1.wells()[0])
        pipette_left.dispense(100, well_plate_1.wells()[i*8])
        pipette_left.drop_tip()

    # Storing tiprack_200_1
    # MOVING: tiprack_200_1 = B1 --> Stacker_2 and store
    protocol.move_labware(labware=tiprack_200_1, new_location=stacker_2, use_gripper=True)
    tiprack_200_1 = stacker_2.store()

    # # This is pulling the second tiprack from the stacker and placing it on the shuttle which is located at A4 

    tiprack_200_2 = replace_tip_rack()

    for i in range(12):
        pipette_left.pick_up_tip(tiprack_200_2)
        pipette_left.aspirate(100, reservoir_1.wells()[1])
        pipette_left.dispense(100, well_plate_1.wells()[i*8])
        pipette_left.drop_tip()

    # Storing tiprack_200_2
    protocol.move_labware(labware=tiprack_200_2, new_location=stacker_2, use_gripper=True)
    tiprack_200_2 = stacker_2.store()
```