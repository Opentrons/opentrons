## Critical Lessons for the Usage of Flex Stacker Module

### 1. **Tip Rack Lid Management is Essential**
- **Problem**: Tip racks retrieved from stackers have lids that prevent pipette access
- **Solution**: Always use `protocol.move_lid(tiprack, trash, use_gripper=True)` after retrieving tip rack lids
- **Rule**: Stackers require lids for tip racks (`lid='opentrons_flex_tiprack_lid'`), but tip rack lids must be removed before use

### 2. **Tip Rack Lid Management and Transfer Options**
The `move_lid()` command provides three destination options for tip rack lids:
1. **Trash Bin**: `protocol.move_lid(source_tiprack, trash_bin, use_gripper=True)`
2. **Waste Chute**: `protocol.move_lid(source_tiprack, waste_chute, use_gripper=True)`
3. **Another Tip Rack that doesn't have a Tip Rack Lid**: `protocol.move_lid(source_tiprack, destination_tiprack, use_gripper=True)`
- **Rule**: Multiple tip rack lids cannot be stacked on a single tip rack for temporary storage. A maximum of 1 tip rack lid is allowed per tip rack.
- **Rule**: Tip rack lids **cannot** be placed directly on deck slots (only on tip racks or waste). 
 
### 3. **Proper Waste Disposal Hierarchy**
- **Problem**: Attempted to dispose tip racks in trash bin (not allowed)
- **Solution**: 
  - **Tips** → Trash bin (via `pipette.drop_tip()`)
  - **Lids** → Trash bin (via `protocol.move_lid()`)
  - **Tip racks & other labware** → Waste chute (via `protocol.move_labware()`)
- **Rule**: Trash bins only accept tips and lids; everything else goes to waste chute

### 4. **Stacker Configuration Requirements**
- **Rule**: Fresh tip racks without tip rack lids are not allowed in the Flex Stacker.
  - **Tip racks in a supply stacker with tip rack lids**: Must specify `lid='opentrons_flex_tiprack_lid'`
- **Rule**: Used/empty tip racks are allowed to be received and stored in the Flex Stacker with or without tip rack lids.  
  - **Tip racks in a collection stacker with tip rack lids**: Must specify `lid='opentrons_flex_tiprack_lid'`
  - **Tip racks in a collection stacker without tip rack lids**: No lid parameter needed
- **Other labware**: No lid parameter needed
- **Gripper**: Required for all stacker operations (`use_gripper=True`)

### 5. **Tip Rack Lid Recycling**
Optional Tip Rack Lid Recycling Workflow Summary:
1. Use tips from lidless tip_rack_1 on the deck
2. Retrieve fresh tip rack (tip_rack_2) with tip rack lid from supply stacker
3. Transfer tip rack lid from tip_rack_2 to the empty and lidless tip_rack_1
4. Store re-lidded tip_rack_1 in collection stacker
5. Use tips from lidless tip_rack_2
6. Retrieve fresh tip rack (tip_rack_3) with tip rack lid from supply stacker
7. Transfer tip rack lid from tip_rack_3 to the empty and lidless tip_rack_2
8. Store re-lidded tip_rack_2 in collection stacker
9. Repeat as needed until all tip racks are used or the protocol completes

### 6. **Protocol Flow for Stackers**
Basic Flow (No Tip Rack Lid Recycling):
1. Configure stacker with `set_stored_labware()`
2. Retrieve labware with `stacker.retrieve()`
3. Move to workspace with `protocol.move_labware()`
4. Remove tip rack lid to waste chute or trash bin with `protocol.move_lid(tip_rack, waste_chute, use_gripper=True)` or `protocol.move_lid(tip_rack, trash_bin, use_gripper=True)`
5. Use labware normally
6. Dispose used labware to waste chute

Advanced Flow (With Lid Recycling):
1. Configure supply and collection stackers with set_stored_labware()
2. Retrieve fresh tip rack from supply stacker with stacker. retrieve()
3. Move to workspace with protocol.move_labware()
4. Transfer lid to another tip rack for temporary storage with `protocol. move_lid(source_rack, storage_rack, use gripper=True)`
5. Use tips from lidless tip rack
6. Retrieve lid back from storage with `protocol.move_lid(storage_rack, used_rack, use_gripper=True)`
7. Store re-lidded tip rack in collection stacker with `protocol.move_labware()` + `stacker.store()`

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
- [ ] Labware is allowed in adjacent slots (A3, B3, C3, D3)
- [ ] Trash bin only in column 3 or column 1. If four stackers are installed, the trash bin will be blocked from column 3, so column 1 must be used.
- [ ] Waste chute loaded for tip rack disposal
- [ ] Tip rack lid removal after tip rack retrieval OR tip rack lid transfer to temporary storage on lidless tip rack
- [ ] All moves use `use_gripper=True`
- [ ] Proper waste disposal hierarchy followed
- [ ] **Supply stackers configured correctly:**
  - [ ] With 'lid' parameter if storing fresh tip racks
- [ ] **Collection stackers configured correctly:**
  - [ ] Without 'lid' parameter if storing lidless tip racks
  - [ ] With 'lid' parameter if storing re-lidded tip racks
- [ ] **Lid recycling workflow (if applicable):**
- [ ] Temporary lid storage location identified on lidless tip rack
- [ ] Lid retrieval steps included before storing used/empty tip racks

## **Common Stacker Errors and Solutions**

### **Lid Management Errors**

❌ **Error**: `"Cannot move lid to deck slot B2"`
```
APIVersionError: Lid movement to deck slots is not supported
```
✅ **Solution**: Lids can only be moved to:
- Waste disposal (trash bin or waste chute)
- Another tip rack
```python
# Correct
protocol.move_lid(tip_rack, waste_chute, use_gripper=True)
protocol.move_lid(tip_rack_1, tip_rack_2, use_gripper=True)

# Incorrect
protocol.move_lid(tip_rack, "B2", use_gripper=True)
```

---

❌ **Error**: `"Cannot store labware with tip rack lid in stacker configured without tip rack lids"`
```
ValueError: Stacker configured for lidless tip racks but received tip rack with tip rack lid
```
✅ **Solution**: Match stacker configuration to tip rack state:
```python
# For lidless tip racks
collection_stacker.set_stored_labware(
    "opentrons_flex_96_tiprack_200ul",
    count=0
    # No lid parameter
)

# For re-lidded tip racks
collection_stacker.set_stored_labware(
    "opentrons_flex_96_tiprack_200ul",
    count=0,
    lid="opentrons_flex_tiprack_lid"
)
```

---

### **Deck Conflict Errors**

❌ **Error**: `"Deck conflict: slot A3 is blocked by stacker in A4"`
```
DeckConflictError: Cannot load trash bin in slot A3 when stacker occupies A4
```
✅ **Solution**: Avoid adjacent slots for the trash bin when stackers are present:
```python
# Stacker in A4 blocks A3
# Stacker in B4 blocks B3
# Stacker in C4 blocks C3
# Stacker in D4 blocks D3

# Correct: Use column 1 for trash
trash = protocol.load_trash_bin("C1")

# Incorrect: Column 3 is blocked
trash = protocol.load_trash_bin("A3")  # Error if stacker in A4
```

---

❌ **Error**: `"Invalid stacker location: C2"`
```
ValueError: Stacker modules can only be loaded in slots A4, B4, C4, or D4
```
✅ **Solution**: Stackers only load in column 4:
```python
# Correct
stacker = protocol.load_module("flexStackerModuleV1", "A4")

# Incorrect
stacker = protocol.load_module("flexStackerModuleV1", "C2")
```

---

## **Best Practices for Stacker Workflows**

1. **Plan Your Stacker Configuration**
   - Determine if you need lid recycling before configuring stackers
   - Supply stackers always need `lid` parameter
   - Collection stackers need `lid` parameter only if storing re-lidded tip racks

2. **Optimize Deck Layout**
   - Place stackers in column 4 (A4, B4, C4, D4)
   - Place trash bin in column 1 if four stackers are installed
   - Use column 2 for active tip rack working positions

3. **Tip Rack Lid Management Strategy**
   - For simple workflows: discard tip rack lids to waste immediately
   - For organized workflows: recycle tip rack lids to enable tip rack storage
   - Use one tip rack as temporary storage when recycling multiple tip rack lids

4. **Error Prevention**
   - Always use `use_gripper=True` for all labware and lid movements
   - Verify stacker configuration matches your lid management strategy
   - Test deck layout for conflicts before running full protocol

5. **Tip Rack Capacity Planning**
   - Standard Flex tip racks hold 96 tips
   - Calculate total tips needed for protocol
   - Load sufficient tip racks in supply stacker
   - Account for tip rack retrieval time in protocol duration

---

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
