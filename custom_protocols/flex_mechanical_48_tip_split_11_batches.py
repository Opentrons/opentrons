"""Split 11 full Flex tip racks into 22 mechanically selected 48-tip racks.

This protocol is ONLY for a mechanically modified Flex 96-channel pipette whose
remaining nozzles are rows B, C, E, and H (48 nozzles total). The Protocol API
still controls the instrument as a normal 96-channel pipette in ALL-nozzle mode.

Deck layout
-----------
    A1:    full-rack pickup station on a 96-channel adapter
    A2:    empty-rack receiving station on a 96-channel adapter
    B1-D1: three full-rack input buffers, later final residual-rack positions
    B2-D2: three empty-rack input buffers, later final transferred-rack positions
    A3:    full-rack input Stacker shuttle (Stacker at A4)
    B3:    empty-rack input Stacker shuttle (Stacker at B4)
    C3:    residual-rack output Stacker shuttle (Stacker at C4)
    D3:    transferred-rack output Stacker shuttle (Stacker at D4)

The first seven processed pairs are stored in the two output Stackers. The last
four processed pairs remain on deck in A1-D1 and A2-D2. No trash fixture is
loaded and every drop_tip() has an explicit receiving tip rack.

All racks are configured without lids, matching the physical consumables used
by this workflow.
"""

from opentrons import protocol_api


requirements = {
    "robotType": "Flex",
    "apiLevel": "2.25",
}

metadata = {
    "protocolName": "Mechanical 48-Nozzle Tip Split - 11 Full Racks",
    "author": "OpenAI Codex",
    "description": (
        "For a mechanically modified Flex 96-channel pipette retaining rows "
        "B/C/E/H. Splits 11 full tip racks into 22 racks containing 48 tips each."
    ),
}


# Change these two values together if the installed pipette or tips differ.
PIPETTE_LOAD_NAME = "flex_96channel_1000"
TIPRACK_LOAD_NAME = "opentrons_flex_96_tiprack_1000ul"
TIPRACK_ADAPTER_LOAD_NAME = "opentrons_flex_96_tiprack_adapter"
STACKER_LOAD_NAME = "flexStackerModuleV1"

FINAL_ROWS = ("B", "C", "D", "A")
STACKER_HOPPER_COUNT = 6
OUTPUT_STACKER_TOTAL_CAPACITY = 7  # Six in the hopper plus one on the shuttle.


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Run the 11-pair maximum-throughput split workflow."""

    # Four Stackers. Column 3 is reserved for their shuttles.
    full_input_stacker = protocol.load_module(STACKER_LOAD_NAME, "A4")
    empty_input_stacker = protocol.load_module(STACKER_LOAD_NAME, "B4")
    residual_output_stacker = protocol.load_module(STACKER_LOAD_NAME, "C4")
    transferred_output_stacker = protocol.load_module(STACKER_LOAD_NAME, "D4")

    # One additional input rack starts on each input Stacker shuttle. These racks
    # are moved away before the input hoppers are configured with six more racks.
    full_shuttle_rack = full_input_stacker.load_labware(
        TIPRACK_LOAD_NAME,
        label="Full input rack initially on A3 shuttle",
    )
    empty_shuttle_rack = empty_input_stacker.load_labware(
        TIPRACK_LOAD_NAME,
        label="Empty input rack initially on B3 shuttle",
    )

    # Lidless configuration is intentional; the user's racks do not have lids.
    residual_output_stacker.set_stored_labware(
        load_name=TIPRACK_LOAD_NAME,
        count=0,
    )
    transferred_output_stacker.set_stored_labware(
        load_name=TIPRACK_LOAD_NAME,
        count=0,
    )

    pipette = protocol.load_instrument(PIPETTE_LOAD_NAME, "left")

    # Both ALL-mode pickup and ALL-mode return/drop require a 96-channel adapter.
    source_adapter = protocol.load_adapter(TIPRACK_ADAPTER_LOAD_NAME, "A1")
    destination_adapter = protocol.load_adapter(TIPRACK_ADAPTER_LOAD_NAME, "A2")
    initial_source_rack = source_adapter.load_labware(
        TIPRACK_LOAD_NAME,
        label="Initial full rack on A1 pickup station",
    )
    initial_destination_rack = destination_adapter.load_labware(
        TIPRACK_LOAD_NAME,
        label="Initial empty rack on A2 receiving station",
    )

    # Three additional pairs start as direct-deck buffers. They are moved onto
    # A1/A2 before pipetting; B1-D2 become final product positions near the end.
    buffered_source_racks = {
        row: protocol.load_labware(
            TIPRACK_LOAD_NAME,
            f"{row}1",
            label=f"Buffered full rack {row}1",
        )
        for row in ("B", "C", "D")
    }
    buffered_destination_racks = {
        row: protocol.load_labware(
            TIPRACK_LOAD_NAME,
            f"{row}2",
            label=f"Buffered empty rack {row}2",
        )
        for row in ("B", "C", "D")
    }

    def split_pair(
        source_rack: protocol_api.Labware,
        destination_rack: protocol_api.Labware,
        pair_number: int,
    ) -> None:
        """Mechanically move rows B/C/E/H from source to destination."""
        protocol.comment(
            f"Pair {pair_number}/11: mechanically transfer 48 tips "
            "(rows B, C, E, H)."
        )

        # Do not call configure_nozzle_layout(). The controller must remain in
        # normal ALL-nozzle mode; the 48-nozzle selection is purely mechanical.
        pipette.pick_up_tip(source_rack["A1"])
        pipette.drop_tip(destination_rack["A1"])

    def store_output_pair(
        source_rack: protocol_api.Labware,
        destination_rack: protocol_api.Labware,
    ) -> None:
        """Store both resulting half racks in their dedicated output Stackers."""
        protocol.move_labware(
            labware=source_rack,
            new_location=residual_output_stacker,
            use_gripper=True,
        )
        residual_output_stacker.store()

        protocol.move_labware(
            labware=destination_rack,
            new_location=transferred_output_stacker,
            use_gripper=True,
        )
        transferred_output_stacker.store()

    def park_output_pair_on_shuttles(
        source_rack: protocol_api.Labware,
        destination_rack: protocol_api.Labware,
    ) -> None:
        """Park the seventh output pair on C3/D3 without storing it."""
        protocol.move_labware(
            labware=source_rack,
            new_location=residual_output_stacker,
            use_gripper=True,
        )
        protocol.move_labware(
            labware=destination_rack,
            new_location=transferred_output_stacker,
            use_gripper=True,
        )

    # Stage 1: process A1/A2 first, creating space for the two input racks that
    # initially occupy the A3 and B3 shuttles.
    pair_number = 1
    split_pair(initial_source_rack, initial_destination_rack, pair_number)
    store_output_pair(initial_source_rack, initial_destination_rack)

    protocol.move_labware(
        labware=full_shuttle_rack,
        new_location=source_adapter,
        use_gripper=True,
    )
    protocol.move_labware(
        labware=empty_shuttle_rack,
        new_location=destination_adapter,
        use_gripper=True,
    )

    # With A3/B3 now clear, configure six additional racks in each input hopper.
    full_input_stacker.set_stored_labware(
        load_name=TIPRACK_LOAD_NAME,
        count=STACKER_HOPPER_COUNT,
    )
    empty_input_stacker.set_stored_labware(
        load_name=TIPRACK_LOAD_NAME,
        count=STACKER_HOPPER_COUNT,
    )

    # Process the pair that started on the input shuttles.
    pair_number += 1
    split_pair(full_shuttle_rack, empty_shuttle_rack, pair_number)
    store_output_pair(full_shuttle_rack, empty_shuttle_rack)

    # Process the other three pairs initially buffered on deck. Every rack is
    # moved to the fixed A1/A2 adapter stations before pickup/drop.
    for row in ("B", "C", "D"):
        source_rack = buffered_source_racks[row]
        destination_rack = buffered_destination_racks[row]
        protocol.move_labware(
            labware=source_rack,
            new_location=source_adapter,
            use_gripper=True,
        )
        protocol.move_labware(
            labware=destination_rack,
            new_location=destination_adapter,
            use_gripper=True,
        )
        pair_number += 1
        split_pair(source_rack, destination_rack, pair_number)
        store_output_pair(source_rack, destination_rack)

    # Stage 2: process one hopper pair and store it as output number six.
    source_rack = full_input_stacker.retrieve()
    protocol.move_labware(
        labware=source_rack,
        new_location=source_adapter,
        use_gripper=True,
    )

    destination_rack = empty_input_stacker.retrieve()
    protocol.move_labware(
        labware=destination_rack,
        new_location=destination_adapter,
        use_gripper=True,
    )

    pair_number += 1
    split_pair(source_rack, destination_rack, pair_number)
    store_output_pair(source_rack, destination_rack)

    # Process output number seven and leave it on C3/D3. A Stacker hopper holds
    # six bare Flex tip racks; the shuttle provides the seventh position.
    source_rack = full_input_stacker.retrieve()
    protocol.move_labware(
        labware=source_rack,
        new_location=source_adapter,
        use_gripper=True,
    )

    destination_rack = empty_input_stacker.retrieve()
    protocol.move_labware(
        labware=destination_rack,
        new_location=destination_adapter,
        use_gripper=True,
    )

    pair_number += 1
    split_pair(source_rack, destination_rack, pair_number)
    park_output_pair_on_shuttles(source_rack, destination_rack)

    assert pair_number == OUTPUT_STACKER_TOTAL_CAPACITY

    # Stage 3: retrieve and process the last four pairs. Both output Stackers are
    # full (six internal racks plus one shuttle rack), so these eight finished
    # half racks remain on A1-D1 and A2-D2. The first three finished pairs are
    # moved to B-D; the last pair remains on the A1/A2 adapters.
    for row in FINAL_ROWS:
        source_rack = full_input_stacker.retrieve()
        protocol.move_labware(
            labware=source_rack,
            new_location=source_adapter,
            use_gripper=True,
        )

        destination_rack = empty_input_stacker.retrieve()
        protocol.move_labware(
            labware=destination_rack,
            new_location=destination_adapter,
            use_gripper=True,
        )

        pair_number += 1
        split_pair(source_rack, destination_rack, pair_number)

        if row != "A":
            protocol.move_labware(
                labware=source_rack,
                new_location=f"{row}1",
                use_gripper=True,
            )
            protocol.move_labware(
                labware=destination_rack,
                new_location=f"{row}2",
                use_gripper=True,
            )

    assert pair_number == 11
    protocol.comment(
        "Complete: 7 residual racks are in C4, 7 transferred racks are in D4, "
        "and the final 4+4 half racks remain on A1-D1 and A2-D2."
    )
