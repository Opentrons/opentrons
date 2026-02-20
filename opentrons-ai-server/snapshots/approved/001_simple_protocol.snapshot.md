# API Response Snapshot

**Status:** 200

## Reply

```python
from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent Transfer Protocol',
    'author': 'User',
    'description': 'Simple reagent transfer using P1000 Single-Channel GEN2 pipettes'
}
requirements = {"robotType": "OT-2", "apiLevel": "2.19"}

def run(protocol: protocol_api.ProtocolContext):
    # Load labware
    source_plate = protocol.load_labware('thermoscientificnunc_96_wellplate_1300ul', 9)
    destination_plate = protocol.load_labware('opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat', 10)
    tiprack_1000ul_filter = protocol.load_labware('opentrons_96_filtertiprack_1000ul', 8)
    tiprack_1000ul = protocol.load_labware('opentrons_96_tiprack_1000ul', 3)

    # Load pipettes
    p1000_left = protocol.load_instrument('p1000_single_gen2', mount="left", tip_racks=[tiprack_1000ul_filter])
    p1000_right = protocol.load_instrument('p1000_single_gen2', mount="right", tip_racks=[tiprack_1000ul])

    # Transfer reagents using left pipette
    transfer_vol_1 = 196
    source_wells_1 = [source_plate.wells_by_name()[well] for well in ['A7', 'A6', 'A5', 'A2', 'A3']]
    dest_wells_1 = [destination_plate.wells_by_name()[well] for well in ['A5', 'A9', 'A1', 'A10', 'A2']]
    p1000_left.transfer(transfer_vol_1, source_wells_1, dest_wells_1, new_tip="always")

    # Transfer reagents using right pipette
    transfer_vol_2 = 8
    source_wells_2 = [source_plate.wells_by_name()[well] for well in ['A9', 'A12', 'A6', 'A10', 'A3']]
    dest_wells_2 = [destination_plate.wells_by_name()[well] for well in ['A7', 'A11', 'A6', 'A3', 'A9']]
    p1000_right.transfer(transfer_vol_2, source_wells_2, dest_wells_2, new_tip="once")
```

**fake:** True
