## Critical Lessons for the Usage of Flex Stacker Module

### 1. **Lid Management is Essential**
- **Problem**: Tip racks retrieved from stackers have lids that prevent pipette access
- **Solution**: Always use `protocol.move_lid(tiprack, trash, use_gripper=True)` after retrieving tip racks
- **Rule**: Stackers require lids for tip racks (`lid='opentrons_flex_tiprack_lid'`), but lids must be removed before use

### 2. **Proper Waste Disposal Hierarchy**
- **Problem**: Attempted to dispose tip racks in trash bin (not allowed)
- **Solution**: 
  - **Tips** → Trash bin (via `pipette.drop_tip()`)
  - **Lids** → Trash bin (via `protocol.move_lid()`)
  - **Tip racks & other labware** → Waste chute (via `protocol.move_labware()`)
- **Rule**: Trash bins only accept tips and lids; everything else goes to waste chute

### 3. **Stacker Slot Restrictions**
- **Problem**: Trash bin placement conflicts with stacker adjacency rules
- **Solution**: Stackers in A4/B4 block adjacent slots A3/B3
- **Rule**: 
  - Stackers only in slots A4, B4, C4, D4
  - Adjacent slots (A3, B3, C3, D3) become unusable
  - Trash bins can only go in columns 1 or 3

### 4. **Deck Layout Planning**
- **Problem**: Multiple slot conflicts due to stacker physical footprint
- **Solution**: Plan entire deck layout considering stacker adjacency
- **Final Working Layout**:
  ```
  A4: Stacker 1 (blocks A3)
  B4: Stacker 2 (blocks B3)  
  C1: Trash bin (column 1 allowed)
  C2: Tip rack workspace
  C3: Tip rack workspace  
  D1: Reservoir
  D2: PCR plate workspace
  D3: Waste chute
  ```

### 5. **Stacker Configuration Requirements**
- **Tip racks**: Must specify `lid='opentrons_flex_tiprack_lid'`
- **Other labware**: No lid parameter needed
- **Gripper**: Required for all stacker operations (`use_gripper=True`)

### 6. **Protocol Flow for Stackers**
1. Configure stacker with `set_stored_labware()`
2. Retrieve labware with `stacker.retrieve()`
3. Move to workspace with `protocol.move_labware()`
4. Remove lid if tip rack with `protocol.move_lid()`
5. Use labware normally
6. Store back with `protocol.move_labware()` + `stacker.store()`

## General Protocol Development Lessons

### 7. **Simulation-Driven Development**
- Always simulate protocols to catch errors early
- Fix one error at a time and re-simulate
- Don't assume fixes work without testing

### 8. **Error Message Analysis**
- Read error messages carefully for specific constraints
- Slot restrictions are often clearly stated in errors
- API limitations are usually well-documented in error messages

### 9. **Documentation Cross-Reference**
- Stacker documentation clearly states slot and adjacency rules
- Waste disposal rules are documented but easy to miss
- Always check both module-specific and general API docs

## Checklist for Future Stacker Protocols

- [ ] Stackers only in A4, B4, C4, D4
- [ ] No labware in adjacent slots (A3, B3, C3, D3)
- [ ] Trash bin in column 1 or 3 only
- [ ] Waste chute loaded for tip rack disposal
- [ ] Lid removal after tip rack retrieval
- [ ] All moves use `use_gripper=True`
- [ ] Proper waste disposal hierarchy followed

These lessons will prevent the three major error categories I encountered: lid access issues, waste disposal violations, and deck slot conflicts.

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