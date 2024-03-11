from typing import List

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
ADAPTERS_COUNT = 5


def run(protocol: ProtocolContext):
    adapters: List[Labware] = []
    for i in range(ADAPTERS_COUNT):
        parent = adapters[-1] if adapters else protocol
        adapters.append(parent.load_adapter(ADAPTERS_DEFINITION))  # FIXME: how to load an adapter on-top of adapter?
