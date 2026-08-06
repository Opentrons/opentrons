"""Split 13 full racks into 26 half racks on the compact four-Stacker deck.

Available deck positions supplied by the user:
    A1 A2 A3
    B1 B2 B3
       C2 C3
       D2 D3

Stackers are installed at A4, B4, C4, and D4. Their shuttles occupy A3-D3.
C1 and D1 are unavailable. No trash fixture is loaded.

Hardware and consumable assumptions
------------------------------------
* Mechanically modified Flex 96-channel pipette retaining physical nozzle rows
  B, C, E, and H (48 physical nozzles).
* Flex Gripper installed.
* Two 96-channel tip-rack adapters installed at A1 and A2.
* All racks are lidless.
* Physical T20/T50/T200/T1000 racks share the same rack geometry and are all
  represented in software as T1000 racks for the tallest motion envelope.

Maximum-throughput loading
--------------------------
* Each Stacker hopper contains six racks in retrieval order:
  FULL, EMPTY, FULL, EMPTY, FULL, EMPTY.
* Four Stackers provide 12 input pairs.
* C2/D2 hold one additional input pair.
* Total: 13 full racks + 13 empty racks -> 26 half racks.

During each Stacker cycle, B1/B2 park the first processed pair, two other
Stacker shuttles park the second pair, and the third pair remains at A1/A2.
The current Stacker is completely emptied before its six outputs are stored
back into it, preventing processed racks from blocking unprocessed racks.
"""

from opentrons import protocol_api


requirements = {
    "robotType": "Flex",
    "apiLevel": "2.25",
}

metadata = {
    "protocolName": "Mechanical 48-Nozzle Split - Compact Deck - 26 Outputs",
    "author": "OpenAI Codex",
    "description": (
        "Maximum distribution for available slots A1/A2/A3, B1/B2/B3, "
        "C2/C3, D2/D3 with four Stackers. Produces 26 half racks."
    ),
}


PIPETTE_LOAD_NAME = "flex_96channel_1000"
UNIVERSAL_TIPRACK_LOAD_NAME = "opentrons_flex_96_tiprack_1000ul"
TIPRACK_ADAPTER_LOAD_NAME = "opentrons_flex_96_tiprack_adapter"
STACKER_LOAD_NAME = "flexStackerModuleV1"

STACKER_LOCATIONS = ("A4", "B4", "C4", "D4")
RACKS_PER_STACKER = 6
PAIRS_PER_STACKER = 3
TOTAL_PAIRS = 13


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Run the compact-deck 13-pair maximum-throughput workflow."""

    protocol.comment(
        "Universal tip mode: T20/T50/T200/T1000 physical racks are represented "
        "as T1000 racks for conservative height and collision planning."
    )

    pipette = protocol.load_instrument(PIPETTE_LOAD_NAME, "left")
    stackers = [
        protocol.load_module(STACKER_LOAD_NAME, location)
        for location in STACKER_LOCATIONS
    ]

    # Physical bottom-to-top loading must make retrieve() return the following
    # alternating sequence. The software sees one common rack definition.
    for index, stacker in enumerate(stackers, start=1):
        stacker.set_stored_labware(
            load_name=UNIVERSAL_TIPRACK_LOAD_NAME,
            count=RACKS_PER_STACKER,
        )
        protocol.comment(
            f"Stacker {index} retrieval order must be: "
            "FULL, EMPTY, FULL, EMPTY, FULL, EMPTY."
        )

    # Both standard ALL-mode pickup and drop/return require an adapter.
    source_adapter = protocol.load_adapter(TIPRACK_ADAPTER_LOAD_NAME, "A1")
    destination_adapter = protocol.load_adapter(TIPRACK_ADAPTER_LOAD_NAME, "A2")

    # The only persistent deck input pair. B1/B2 must remain free for parking.
    deck_source_rack = protocol.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        "C2",
        label="Deck full rack 1",
    )
    deck_destination_rack = protocol.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        "D2",
        label="Deck empty rack 1",
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

        # Do not configure a software partial-nozzle layout. The API stays in
        # normal ALL mode; the 48-nozzle pattern is entirely mechanical.
        pipette.pick_up_tip(source_rack["A1"])
        pipette.drop_tip(destination_rack["A1"])

    pair_number = 1

    # Process the single deck pair and return its two outputs to C2/D2.
    protocol.move_labware(deck_source_rack, source_adapter, use_gripper=True)
    protocol.move_labware(
        deck_destination_rack,
        destination_adapter,
        use_gripper=True,
    )
    split_pair(deck_source_rack, deck_destination_rack, pair_number)
    protocol.move_labware(deck_source_rack, "C2", use_gripper=True)
    protocol.move_labware(deck_destination_rack, "D2", use_gripper=True)

    # Process each six-rack Stacker independently.
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
            # The first rack retrieved must be physically full; the second must
            # be physically empty. Repeat this sequence three times.
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
                # B1/B2 are the only free regular deck buffer positions.
                protocol.move_labware(source_rack, "B1", use_gripper=True)
                protocol.move_labware(destination_rack, "B2", use_gripper=True)
            elif local_pair_index == 1:
                # Borrow two other empty shuttles without storing into their
                # hoppers. They are cleared again before those Stackers run.
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
            # The third pair remains on the A1/A2 adapters.

        # The current hopper is now empty. Store its six processed outputs back.
        # Start with the A1/A2 pair to clear the fixed workstations.
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
        "Complete: 13 full racks plus 13 empty racks became 26 half racks. "
        "Each Stacker contains six processed racks; C2/D2 contain the final "
        "two processed deck racks."
    )

