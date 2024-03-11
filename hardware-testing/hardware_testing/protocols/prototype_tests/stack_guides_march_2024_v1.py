from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "stack-guides-march-2024-v1"}
requirements = {"robotType": "Flex", "apiLevel": "2.16"}


"""
Gripper picks up a tip-rack from a deck-slot (anywhere)
 - then, drop tip-rack into tip-rack guide
 - pause, wait for tester to press continue
 - then, drop a 2nd tip-rack on top of that previous tip-rack
 - pause, wait for tester to press continue
Repeat step 2, but with purposeful XYZ offsets,
 - Each time, make the offset larger
 - Eventually a collision will occur (or the tester will Cancel the protocol)
 - Include the current offset in the PAUSE messages, so we can then record the failing offset
Protocol is now complete
 - Test can repeated, and Tester can modify the Protocol
"""


def run(protocol: ProtocolContext):
    pass
