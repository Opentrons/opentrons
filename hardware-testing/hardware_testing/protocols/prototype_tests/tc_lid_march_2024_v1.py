from opentrons.protocol_api import ProtocolContext

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


def run(protocol: ProtocolContext):
    pass
