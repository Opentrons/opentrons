"""Split 14 full racks into 28 half racks with four Flex Stackers.

This protocol is ONLY for a mechanically modified Flex 96-channel pipette whose
remaining physical nozzles are rows B, C, E, and H (48 nozzles total).

Maximum-throughput strategy
---------------------------
* Four Stackers are installed at A4-D4.
* Each Stacker hopper contains six lidless racks in retrieval order:
  FULL, EMPTY, FULL, EMPTY, FULL, EMPTY.
* Each Stacker therefore supplies three input pairs (12 pairs total).
* Two additional pairs start on deck in B1/B2 and C1/C2.
* A1 and A2 are fixed 96-channel adapter workstations.
* D1/D2 and two temporarily borrowed Stacker shuttles park intermediate output.
* Each Stacker is completely emptied before its six processed racks are stored
  back into that same Stacker. This prevents processed racks from blocking
  unprocessed racks at the bottom of the hopper.

The protocol loads no trash fixture. T20/T50/T200/T1000 physical racks are all
intentionally represented as T1000 racks, matching the user's equal-rack-geometry
requirement and using the tallest motion-planning envelope.
"""

from opentrons import protocol_api


requirements = {
    "robotType": "Flex",
    "apiLevel": "2.25",
}

metadata = {
    "protocolName": "Mechanical 48-Nozzle Split - 14 Batches - 28 Outputs",
    "author": "OpenAI Codex",
    "description": (
        "Four-Stacker maximum-throughput workflow. Splits 14 full racks into "
        "28 racks containing 48 tips each, with no trash fixture."
    ),
}


PIPETTE_LOAD_NAME = "flex_96channel_1000"
UNIVERSAL_TIPRACK_LOAD_NAME = "opentrons_flex_96_tiprack_1000ul"
TIPRACK_ADAPTER_LOAD_NAME = "opentrons_flex_96_tiprack_adapter"
STACKER_LOAD_NAME = "flexStackerModuleV1"

STACKER_LOCATIONS = ("A4", "B4", "C4", "D4")
RACKS_PER_STACKER = 6
PAIRS_PER_STACKER = 3
TOTAL_PAIRS = 14


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Run the 14-pair, 28-output maximum-throughput workflow."""

    protocol.comment(
        "Universal tip mode: T20/T50/T200/T1000 physical racks are represented "
        "as T1000 racks for conservative height and collision planning."
    )

    pipette = protocol.load_instrument(PIPETTE_LOAD_NAME, "left")
    stackers = [
        protocol.load_module(STACKER_LOAD_NAME, location)
        for location in STACKER_LOCATIONS
    ]

    # The physical bottom-to-top loading order must make retrieve() return:
    # FULL, EMPTY, FULL, EMPTY, FULL, EMPTY.
    for index, stacker in enumerate(stackers, start=1):
        stacker.set_stored_labware(
            load_name=UNIVERSAL_TIPRACK_LOAD_NAME,
            count=RACKS_PER_STACKER,
        )
        protocol.comment(
            f"Stacker {index} must be physically loaded in retrieval order: "
            "FULL, EMPTY, FULL, EMPTY, FULL, EMPTY."
        )

    source_adapter = protocol.load_adapter(TIPRACK_ADAPTER_LOAD_NAME, "A1")
    destination_adapter = protocol.load_adapter(TIPRACK_ADAPTER_LOAD_NAME, "A2")

    # Two additional deck pairs bring the total from 12 to 14 pairs.
    deck_source_racks = [
        protocol.load_labware(
            UNIVERSAL_TIPRACK_LOAD_NAME,
            slot,
            label=f"Deck full rack {pair_number}",
        )
        for pair_number, slot in ((1, "B1"), (2, "C1"))
    ]
    deck_destination_racks = [
        protocol.load_labware(
            UNIVERSAL_TIPRACK_LOAD_NAME,
            slot,
            label=f"Deck empty rack {pair_number}",
        )
        for pair_number, slot in ((1, "B2"), (2, "C2"))
    ]

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

        # Keep normal ALL-nozzle software mode. The arbitrary 48-nozzle pattern
        # is produced solely by the mechanically modified pipette.
        pipette.pick_up_tip(source_rack["A1"])
        pipette.drop_tip(destination_rack["A1"])

    def process_deck_pair(
        source_rack: protocol_api.Labware,
        destination_rack: protocol_api.Labware,
        source_home: str,
        destination_home: str,
        pair_number: int,
    ) -> None:
        """Process a deck-buffered pair and return both outputs to its slots."""
        protocol.move_labware(source_rack, source_adapter, use_gripper=True)
        protocol.move_labware(destination_rack, destination_adapter, use_gripper=True)
        split_pair(source_rack, destination_rack, pair_number)
        protocol.move_labware(source_rack, source_home, use_gripper=True)
        protocol.move_labware(destination_rack, destination_home, use_gripper=True)

    pair_number = 0

    # Process the two deck pairs first. Their outputs remain in B1/B2 and C1/C2.
    for source_rack, destination_rack, source_home, destination_home in zip(
        deck_source_racks,
        deck_destination_racks,
        ("B1", "C1"),
        ("B2", "C2"),
    ):
        pair_number += 1
        process_deck_pair(
            source_rack,
            destination_rack,
            source_home,
            destination_home,
            pair_number,
        )

    # Process each Stacker independently. Two other Stacker shuttles are used as
    # temporary parking for the second processed pair. D1/D2 park the first pair;
    # the third pair remains on A1/A2 until the current Stacker is empty.
    for stacker_index, current_stacker in enumerate(stackers):
        other_stackers = [
            stacker
            for index, stacker in enumerate(stackers)
            if index != stacker_index
        ]
        borrowed_source_shuttle = other_stackers[0]
        borrowed_destination_shuttle = other_stackers[1]

        processed_pairs: list[
            tuple[protocol_api.Labware, protocol_api.Labware]
        ] = []

        for local_pair_index in range(PAIRS_PER_STACKER):
            # Physical rack order is significant: first retrieval is full, second
            # retrieval is empty, repeated three times.
            source_rack = current_stacker.retrieve()
            protocol.move_labware(source_rack, source_adapter, use_gripper=True)

            destination_rack = current_stacker.retrieve()
            protocol.move_labware(
                destination_rack,
                destination_adapter,
                use_gripper=True,
            )

            pair_number += 1
            split_pair(source_rack, destination_rack, pair_number)
            processed_pairs.append((source_rack, destination_rack))

            if local_pair_index == 0:
                protocol.move_labware(source_rack, "D1", use_gripper=True)
                protocol.move_labware(destination_rack, "D2", use_gripper=True)
            elif local_pair_index == 1:
                protocol.move_labware(
                    source_rack,
                    borrowed_source_shuttle,
                    use_gripper=True,
                )
                protocol.move_labware(
                    destination_rack,
                    borrowed_destination_shuttle,
                    use_gripper=True,
                )
            # local_pair_index == 2 remains on A1/A2.

        # The current hopper is now empty. Store all six processed racks into it.
        # Store the A1/A2 pair first to clear the fixed adapter workstations.
        store_order = (
            processed_pairs[2],
            processed_pairs[0],
            processed_pairs[1],
        )
        for source_rack, destination_rack in store_order:
            protocol.move_labware(
                source_rack,
                current_stacker,
                use_gripper=True,
            )
            current_stacker.store()
            protocol.move_labware(
                destination_rack,
                current_stacker,
                use_gripper=True,
            )
            current_stacker.store()

    assert pair_number == TOTAL_PAIRS
    protocol.comment(
        "Complete: 14 full racks plus 14 empty racks became 28 half racks. "
        "Each Stacker contains six processed racks, and B1/B2/C1/C2 contain "
        "the four processed deck racks."
    )
