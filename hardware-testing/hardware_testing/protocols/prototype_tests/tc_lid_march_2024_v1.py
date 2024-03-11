from typing import List, Dict, Any, Optional

from opentrons.protocol_api import ProtocolContext, Labware

# NOTE: branch used for previous testing >>> `thermocycler_lid_testing_for_hardware`

metadata = {"protocolName": "tc-lid-march-2024-v1"}
requirements = {"robotType": "Flex", "apiLevel": "2.16"}


"""
Protocol starts:
 - 1-5x lids are stacked in deck D2
 - Thermocycler installed
For each lid on the stack:
 - Gripper picks up top-most lid
 - Lid placed in TC
 - pause, wait for tester to press continue
 - Lid removed from TC, placed into deck-slot C2
   - Stack onto previously placed lids
 - pause, wait for tester to press continue
Protocol is now complete
 - Repeat same Protocol, but incorporate the same XYZ offset test as described above for the tip-rack guides
 - Include the current offset in the PAUSE messages, so we can then record the failing offset
"""

ADAPTERS_DEFINITION = "tc_lid_march_2024_v1"
ADAPTERS_STARTING_SLOT = "D2"
ADAPTERS_ENDING_SLOT = "C2"
ADAPTERS_COUNT = 5

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
    # load stacked adapters
    adapters: List[Labware] = []
    for i in range(ADAPTERS_COUNT):
        parent = adapters[-1] if adapters else protocol
        adapters.append(parent.load_adapter(ADAPTERS_DEFINITION))  # FIXME: cannot load adapter using adapter

    if USING_THERMOCYCLER:
        # load thermocycler
        thermocycler = protocol.load_module("thermocyclerModuleV2")
        thermocycler.open_lid()
        plate_in_cycler = thermocycler.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt")

    # pickup lids from stack, place in cycler, then finally re-stack on new-slot
    for i in range(ADAPTERS_COUNT - 1, -1, -1):
        lid = adapters[i]
        destination = adapters[i + 1] if i + 1 < len(adapters) else ADAPTERS_ENDING_SLOT
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
            destination,
            plate_in_cycler,
            pick_up_offset={"x": 0, "y": 0, "z": 0},  # PICK-UP from THERMOCYCLER
            drop_offset={"x": 0, "y": 0, "z": 0},  # DROP-OFF in DECK-SLOT
        )
