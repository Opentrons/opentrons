from typing import List, Dict, Any, Optional
from opentrons.protocol_api import ProtocolContext, Labware

metadata = {"protocolName": "5 Lid Stack Evap Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.16"}

"""
Setup:
 - 1-5x lids are stacked in deck D3
 - Thermocycler installed

Run:
 - For each lid in the stack (1-5x)
   - Move lid in D2 to Thermocycler
     - Remove top-most lid
     - PAUSE, wait for tester to press continue
   - Move lid from Thermocycler to new slot C2
     - Stacked onto any previously placed lids
     - PAUSE, wait for tester to press continue
"""

LID_STARTING_SLOT = "D2"
LID_COUNT = 5
LID_DEFINITION = "tc_lid_march_2024_v1"
LID_BOTTOM_DEFINITION = "tc_lid_march_2024_v1"

EVAP_TEST = True
QUICK_TEST = False
LONG_HOLD_TEST = False

OFFSET_DECK = {
    "pick-up": {"x": 0, "y": 0, "z": 0},
    "drop": {"x": 0, "y": 0, "z": 0},
}
OFFSET_THERMOCYCLER = {
    "pick-up": {"x": 0, "y": 0, "z": -4},
    "drop": {"x": 0, "y": 0, "z": 0}
}

def _move_labware_with_offset(
    protocol: ProtocolContext,
    labware: Labware,
    destination: Any,
    pick_up_offset: Optional[Dict[str, float]] = None,
    drop_offset: Optional[Dict[str, float]] = None,
) -> None:
    protocol.move_labware(
        labware,
        destination,
        use_gripper=True,
        pick_up_offset=pick_up_offset,
        drop_offset=drop_offset,
    )

def run(protocol: ProtocolContext):
    # SETUP
    thermocycler = protocol.load_module("thermocyclerModuleV2")
    tiprack_50_1    = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'C3')
    p1000 = protocol.load_instrument("flex_8channel_1000", "left", tip_racks = [tiprack_50_1])
    trashA1 = protocol.load_trash_bin("A3") 
    wasteChute = protocol.load_waste_chute()
    
    thermocycler.open_lid()
    plate_in_cycler = thermocycler.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt"
    )
    
    reservoir       = protocol.load_labware('nest_12_reservoir_15ml','A2')
    lids: List[Labware] = [protocol.load_labware(LID_BOTTOM_DEFINITION, LID_STARTING_SLOT)]
    for i in range(LID_COUNT - 1):
        lids.append(lids[-1].load_labware(LID_DEFINITION))
    lids.reverse()
    top_lid = lids[0]
    bottom_lid = lids[1]
    
    # DEFINE TESTS #
    def long_hold_test():
        # Long hold test
        thermocycler.set_block_temperature(4, hold_time_minutes=5)
        thermocycler.set_lid_temperature(105, hold_time_minutes = 5)
        thermocycler.set_block_temperature(98, hold_time_minutes=5)
        thermocycler.set_block_temperature(4, hold_time_minutes=5)
        thermocycler.open_lid()    
        
    def fill_with_liquid_and_measure():
        # Fill plate and measure
        locations = [plate_in_cycler['A1'].bottom(z=0.5),
                plate_in_cycler['A2'].bottom(z=0.5),
                plate_in_cycler['A3'].bottom(z=0.5),
                plate_in_cycler['A4'].bottom(z=0.5),
                plate_in_cycler['A5'].bottom(z=0.5),
                plate_in_cycler['A6'].bottom(z=0.5),
                plate_in_cycler['A7'].bottom(z=0.5),
                plate_in_cycler['A8'].bottom(z=0.5),
                plate_in_cycler['A9'].bottom(z=0.5),
                plate_in_cycler['A10'].bottom(z=0.5),
                plate_in_cycler['A11'].bottom(z=0.5),
                plate_in_cycler['A12'].bottom(z=0.5)]
        volumes = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
        protocol.pause('Weight Armadillo Plate, place on thermocycler')
        # pipette 10uL into Armadillo wells-
        p1000.distribute(volume = volumes, source = reservoir['A1'], dest = locations, return_tips = True, blow_out = False)
        protocol.pause('Weight Armadillo Plate, place on thermocycler, put on lid')
    
    def pcr_cycle(num_of_cycles: int = 30):
        # 30x cycles of: 70° for 30s 72° for 30s 95° for 10s 
        profile_TAG2 = [{'temperature': 70, 'hold_time_seconds': 30}, {'temperature': 72, 'hold_time_seconds': 30}, {'temperature': 95, 'hold_time_seconds': 10}]
        thermocycler.execute_profile(steps = profile_TAG2, repetitions = num_of_cycles,block_max_volume=50)
    
    def move_lid() -> None:
        """Move lid from tc to deck """
        # Move lid from thermocycler to deck to stack to waste chute
        thermocycler.open_lid()
        # Move Lid to Deck
        _move_labware_with_offset(protocol, top_lid, "B2", pick_up_offset = OFFSET_THERMOCYCLER["pick-up"], drop_offset=OFFSET_DECK["drop"])
        # Move Lid to Stack
        _move_labware_with_offset(protocol, top_lid, bottom_lid, pick_up_offset = OFFSET_THERMOCYCLER["pick-up"], drop_offset=OFFSET_DECK["drop"])
        # Move Lid to Waste Chute
        _move_labware_with_offset(protocol, top_lid, wasteChute, pick_up_offset = OFFSET_DECK["pick-up"])
    thermocycler.set_block_temperature(4)
    thermocycler.set_lid_temperature(105)
        
    #hold at 95° for 3 minutes
    profile_TAG = [{'temperature': 95, 'hold_time_minutes': 3}]
    #hold at 72° for 5min 
    profile_TAG3 = [{'temperature': 72, 'hold_time_minutes': 5}]
    
    if QUICK_TEST:
        thermocycler.set_block_temperature(4)
        thermocycler.set_lid_temperature(105)
        _move_labware_with_offset(protocol, top_lid, plate_in_cycler, pick_up_offset = OFFSET_DECK["pick-up"], drop_offset=OFFSET_THERMOCYCLER["drop"])
        thermocycler.close_lid()
    
    if LONG_HOLD_TEST:
        _move_labware_with_offset(protocol, top_lid, plate_in_cycler, pick_up_offset = OFFSET_DECK["pick-up"], drop_offset=OFFSET_THERMOCYCLER["drop"])
        long_hold_test()
        _move_labware_with_offset(protocol, top_lid, "B2", pick_up_offset = OFFSET_THERMOCYCLER["pick-up"], drop_offset=OFFSET_DECK["drop"])
        long_hold_test()
        fill_with_liquid_and_measure()
        thermocycler.close_lid()
        pcr_cycle()
        move_lid()
        
    # Go through PCR cycle
    if EVAP_TEST:
        fill_with_liquid_and_measure()
        _move_labware_with_offset(protocol, top_lid, plate_in_cycler, pick_up_offset = OFFSET_DECK["pick-up"], drop_offset=OFFSET_THERMOCYCLER["drop"])
        thermocycler.close_lid()
        thermocycler.execute_profile(steps = profile_TAG, repetitions = 1,block_max_volume=50)
        pcr_cycle()
        thermocycler.execute_profile(steps = profile_TAG3, repetitions = 1,block_max_volume=50)
        # # # Cool to 4° 
        thermocycler.set_block_temperature(4)
        thermocycler.set_lid_temperature(105)
        # Open lid
    thermocycler.open_lid()
    move_lid()
    protocol.pause("Weigh armadillo plate.")
