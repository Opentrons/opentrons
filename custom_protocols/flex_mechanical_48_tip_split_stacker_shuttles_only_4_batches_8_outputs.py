"""Split four full racks using only deck and Flex Stacker shuttle positions.

The four Stackers are installed at A4-D4, but their internal hopper storage is
not used. Only their A3-D3 shuttle positions are used as ordinary deck storage.
This protocol never calls set_stored_labware(), retrieve(), or store().

Available positions
-------------------
    A1 A2 A3
    B1 B2 B3
       C2 C3
       D2 D3

Initial maximum-throughput layout
---------------------------------
    A1: full rack 1 on 96-channel adapter (pickup workstation)
    A2: empty rack 1 on 96-channel adapter (drop workstation)
    B1/B2: full/empty pair 2
    C2/D2: full/empty pair 3
    A3/B3: full/empty pair 4 on Stacker shuttles
    C3/D3: initially empty rolling exchange positions

Four pairs are the maximum because the single Gripper needs empty rolling
positions to exchange subsequent pairs through the fixed A1/A2 adapters.

Hardware assumptions
--------------------
* Mechanically modified Flex 96-channel pipette retaining nozzle rows B, C, E,
  and H (48 physical nozzles).
* Flex Gripper installed.
* Four Flex Stackers installed, with empty hoppers and empty shuttles except for
  the explicitly loaded A3/B3 input pair.
* No trash fixture.
* All racks are lidless and share the same external geometry.
* Physical T20/T50/T200/T1000 racks are represented as T1000 racks to use the
  tallest motion-planning envelope.
"""

from opentrons import protocol_api


requirements = {
    "robotType": "Flex",
    "apiLevel": "2.25",
}

metadata = {
    "protocolName": "Mechanical 48-Nozzle Split - Stacker Shuttles Only - 8 Outputs",
    "author": "OpenAI Codex",
    "description": (
        "Uses A1/A2/A3, B1/B2/B3, C2/C3, D2/D3 only. Stacker hoppers are "
        "unused. Splits four full racks into eight 48-tip racks."
    ),
}


PIPETTE_LOAD_NAME = "flex_96channel_1000"
UNIVERSAL_TIPRACK_LOAD_NAME = "opentrons_flex_96_tiprack_1000ul"
TIPRACK_ADAPTER_LOAD_NAME = "opentrons_flex_96_tiprack_adapter"
STACKER_LOAD_NAME = "flexStackerModuleV1"

TOTAL_PAIRS = 4


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Run the four-pair shuttle-only maximum-throughput workflow."""

    protocol.comment(
        "Stacker hopper storage is disabled by design; only A3-D3 shuttle "
        "positions are used."
    )
    protocol.comment(
        "Universal tip mode: T20/T50/T200/T1000 physical racks are represented "
        "as T1000 racks for conservative height and collision planning."
    )

    pipette = protocol.load_instrument(PIPETTE_LOAD_NAME, "left")

    stacker_a = protocol.load_module(STACKER_LOAD_NAME, "A4")
    stacker_b = protocol.load_module(STACKER_LOAD_NAME, "B4")
    stacker_c = protocol.load_module(STACKER_LOAD_NAME, "C4")
    stacker_d = protocol.load_module(STACKER_LOAD_NAME, "D4")

    # Do not configure any Stacker hopper.
    source_adapter = protocol.load_adapter(TIPRACK_ADAPTER_LOAD_NAME, "A1")
    destination_adapter = protocol.load_adapter(TIPRACK_ADAPTER_LOAD_NAME, "A2")

    source_work_rack = source_adapter.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        label="Full rack 1 on A1 pickup station",
    )
    destination_work_rack = destination_adapter.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        label="Empty rack 1 on A2 drop station",
    )

    source_pair_2 = protocol.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        "B1",
        label="Full rack 2",
    )
    destination_pair_2 = protocol.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        "B2",
        label="Empty rack 2",
    )
    source_pair_3 = protocol.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        "C2",
        label="Full rack 3",
    )
    destination_pair_3 = protocol.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        "D2",
        label="Empty rack 3",
    )

    # A3/B3 are used as ordinary Stacker shuttle deck positions.
    source_pair_4 = stacker_a.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        label="Full rack 4 on A3 shuttle",
    )
    destination_pair_4 = stacker_b.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        label="Empty rack 4 on B3 shuttle",
    )

    def split_pair(
        source_rack: protocol_api.Labware,
        destination_rack: protocol_api.Labware,
        pair_number: int,
    ) -> None:
        """Mechanically move rows B/C/E/H from source to destination."""
        protocol.comment(
            f"Pair {pair_number}/{TOTAL_PAIRS}: mechanically transfer 48 tips "
            "(rows B, C, E, H)."
        )
        pipette.pick_up_tip(source_rack["A1"])
        pipette.drop_tip(destination_rack["A1"])

    # Pair 1 starts on the fixed adapters.
    split_pair(source_work_rack, destination_work_rack, pair_number=1)

    # Each tuple contains the next input pair and the slots it vacates. Those
    # vacated slots become the rolling output positions for the previous pair.
    remaining_pairs = (
        (source_pair_2, destination_pair_2, "B1", "B2"),
        (source_pair_3, destination_pair_3, "C2", "D2"),
        (source_pair_4, destination_pair_4, stacker_a, stacker_b),
    )

    source_output_location: str | protocol_api.FlexStackerContext = stacker_c
    destination_output_location: str | protocol_api.FlexStackerContext = stacker_d

    for pair_number, (
        next_source,
        next_destination,
        vacated_source_location,
        vacated_destination_location,
    ) in enumerate(remaining_pairs, start=2):
        # Park the completed work pair in the currently empty rolling positions.
        protocol.move_labware(
            source_work_rack,
            source_output_location,
            use_gripper=True,
        )
        protocol.move_labware(
            destination_work_rack,
            destination_output_location,
            use_gripper=True,
        )

        # Move the next pair to the two fixed adapter workstations.
        protocol.move_labware(next_source, source_adapter, use_gripper=True)
        protocol.move_labware(
            next_destination,
            destination_adapter,
            use_gripper=True,
        )
        split_pair(next_source, next_destination, pair_number)

        source_work_rack = next_source
        destination_work_rack = next_destination
        source_output_location = vacated_source_location
        destination_output_location = vacated_destination_location

    # Pair 4 remains on A1/A2. The first three pairs occupy C3/D3, B1/B2,
    # and C2/D2. A3/B3 are empty at completion.
    protocol.comment(
        "Complete: four full racks plus four empty racks became eight half racks. "
        "No Stacker hopper storage was used."
    )

