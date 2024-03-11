from typing import Any, Optional, Dict

from opentrons.protocol_api import ProtocolContext, Labware

metadata = {"protocolName": "stack-guides-march-2024-v1"}
requirements = {"robotType": "Flex", "apiLevel": "2.16"}


"""
Gripper picks up a tip-rack from a deck-slot (anywhere)
 - then, drop tip-rack into tip-rack guide
   - PAUSE, wait for tester to press continue
 - then, drop a 2nd tip-rack on top of that previous tip-rack
   - PAUSE, wait for tester to press continue
Repeat above, but with purposeful XYZ offsets
 - Each time, make the offset larger
 - Eventually a collision will occur (or the tester will Cancel the protocol)
 - Include the current offset in the PAUSE messages, so we can then record the failing offset
"""

START_UNSTACKED = True


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
    pass
