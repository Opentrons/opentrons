from typing import List, Dict, Any, Optional

from opentrons.protocol_api import ProtocolContext, Labware

# NOTE: branch used for previous testing >>> `thermocycler_lid_testing_for_hardware`

metadata = {"protocolName": "tc-lid-march-2024-v1"}
requirements = {"robotType": "Flex", "apiLevel": "2.16"}  # TODO: confirm which version to use


"""
Setup:
 - 1-5x lids are stacked in deck D2
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

LID_DEFINITION = "tc_lid_march_2024_v1"
LID_STARTING_SLOT = "D2"
LID_ENDING_SLOT = "C2"
LID_COUNT = 5

USING_THERMOCYCLER = True


def _move_labware_with_offset_and_pause(
        protocol: ProtocolContext,
        labware: Labware,
        destination: Any,
        pick_up_offset: Optional[Dict[str, float]] = None,
        drop_offset: Optional[Dict[str, float]] = None
) -> None:
    protocol.move_labware(
        labware,
        destination,
        use_gripper=True,
        pick_up_offset=pick_up_offset,
        drop_offset=drop_offset,
    )
    protocol.pause(f'Pick(x={round(pick_up_offset["x"], 1)},'
                   f'y={round(pick_up_offset["y"], 1)},'
                   f'z={round(pick_up_offset["z"], 1)}) | '
                   f'Drop(x={round(drop_offset["x"], 1)},'
                   f'y={round(drop_offset["y"], 1)},'
                   f'z={round(drop_offset["z"], 1)})')


def run(protocol: ProtocolContext):
    # SETUP
    lids: List[Labware] = [protocol.load_labware(LID_DEFINITION, LID_STARTING_SLOT)]
    for i in range(LID_COUNT - 1):
        lids.append(lids[-1].load_labware(LID_DEFINITION))
    lids.reverse()  # NOTE: reversing to more easily loop through lids from top-to-bottom
    if USING_THERMOCYCLER:
        # TODO: confirm if we need to load 96-well adapter onto Thermocycler
        thermocycler = protocol.load_module("thermocyclerModuleV2")
        thermocycler.open_lid()
        plate_in_cycler = thermocycler.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt")
    else:
        plate_in_cycler = None

    # RUN
    prev_moved_lid: Optional[Labware] = None
    for lid in lids:
        if USING_THERMOCYCLER:
            _move_labware_with_offset_and_pause(
                protocol,
                lid,
                plate_in_cycler,
                pick_up_offset={"x": 0, "y": 0, "z": 0},  # PICK-UP from STACK
                drop_offset={"x": 0, "y": 0, "z": 0},  # DROP-OFF in THERMOCYCLER
            )
        _move_labware_with_offset_and_pause(
            protocol,
            lid,
            prev_moved_lid if prev_moved_lid else LID_ENDING_SLOT,
            pick_up_offset={"x": 0, "y": 0, "z": 0},  # PICK-UP from THERMOCYCLER
            drop_offset={"x": 0, "y": 0, "z": 0},  # DROP-OFF in DECK-SLOT
        )
        prev_moved_lid = lid
