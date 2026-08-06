"""Split seven full tip racks using a four-slot Flex deck expansion set.

Hardware assumptions
--------------------
* Flex with a mechanically modified 96-channel pipette retaining nozzle rows
  B, C, E, and H (48 physical nozzles).
* Flex Gripper installed.
* Staging-area/expansion fixtures installed and configured for A4-D4.
* No Flex Stackers and no trash fixture.
* All tip racks are lidless and have the same external rack geometry.
* T20/T50/T200/T1000 are all intentionally represented as T1000 racks so all
  motion planning uses the tallest and most conservative tip-height envelope.
* A 96-channel tip-rack adapter is installed in A1 and another in A2.

Maximum-throughput deck layout
------------------------------
    A1: full-rack pickup station on adapter
    A2: empty-rack receiving station on adapter

    B1/C1/D1: buffered full racks 2-4
    B2/C2/D2: buffered empty racks 2-4
    A3/B3/C3: buffered full racks 5-7
    A4/B4/C4: buffered empty racks 5-7
    D3/D4: initially empty rolling exchange positions

The two empty exchange positions are required for the Gripper to swap each new
pair into A1/A2. Seven pairs (14 racks) are therefore the maximum for two fixed
adapter workstations on the 16-position expanded deck.
"""

from opentrons import protocol_api


requirements = {
    "robotType": "Flex",
    "apiLevel": "2.25",
}

metadata = {
    "protocolName": "Mechanical 48-Nozzle Tip Split - Expansion Deck - 7 Racks",
    "author": "OpenAI Codex",
    "description": (
        "No Stacker and no trash. Uses A4-D4 staging slots and two rolling "
        "exchange positions to split seven full racks into fourteen 48-tip racks."
    ),
}


TIPRACK_ADAPTER_LOAD_NAME = "opentrons_flex_96_tiprack_adapter"
PIPETTE_LOAD_NAME = "flex_96channel_1000"
UNIVERSAL_TIPRACK_LOAD_NAME = "opentrons_flex_96_tiprack_1000ul"

SOURCE_BUFFER_SLOTS = ("B1", "C1", "D1", "A3", "B3", "C3")
DESTINATION_BUFFER_SLOTS = ("B2", "C2", "D2", "A4", "B4", "C4")
INITIAL_EXCHANGE_SLOTS = ("D3", "D4")


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Run the seven-pair expansion-deck workflow."""

    protocol.comment(
        "Universal tip mode: physically loaded T20/T50/T200/T1000 racks are all "
        "represented as T1000 racks for conservative height and collision planning."
    )
    pipette = protocol.load_instrument(PIPETTE_LOAD_NAME, "left")

    # Standard ALL-mode pickup and return/drop both require a 96-channel adapter.
    source_adapter = protocol.load_adapter(TIPRACK_ADAPTER_LOAD_NAME, "A1")
    destination_adapter = protocol.load_adapter(TIPRACK_ADAPTER_LOAD_NAME, "A2")

    source_work_rack = source_adapter.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        label="Full rack 1 on A1 pickup station",
    )
    destination_work_rack = destination_adapter.load_labware(
        UNIVERSAL_TIPRACK_LOAD_NAME,
        label="Empty rack 1 on A2 receiving station",
    )

    buffered_sources = [
        protocol.load_labware(
            UNIVERSAL_TIPRACK_LOAD_NAME,
            slot,
            label=f"Buffered full rack {index}",
        )
        for index, slot in enumerate(SOURCE_BUFFER_SLOTS, start=2)
    ]
    buffered_destinations = [
        protocol.load_labware(
            UNIVERSAL_TIPRACK_LOAD_NAME,
            slot,
            label=f"Buffered empty rack {index}",
        )
        for index, slot in enumerate(DESTINATION_BUFFER_SLOTS, start=2)
    ]

    def split_pair(
        source_rack: protocol_api.Labware,
        destination_rack: protocol_api.Labware,
        pair_number: int,
    ) -> None:
        """Mechanically transfer nozzle rows B/C/E/H from one rack to another."""
        protocol.comment(
            f"Pair {pair_number}/7: mechanically transfer 48 tips "
            "(rows B, C, E, H)."
        )

        # The API remains in normal ALL-nozzle mode. The arbitrary 48-nozzle
        # selection is created solely by the modified pipette hardware.
        pipette.pick_up_tip(source_rack["A1"])
        pipette.drop_tip(destination_rack["A1"])

    # Pair 1 is already on the two adapter workstations.
    split_pair(source_work_rack, destination_work_rack, pair_number=1)

    # D3/D4 are the first output parking positions. For every following pair,
    # the vacated buffer slots become the next rolling output positions.
    source_output_slot, destination_output_slot = INITIAL_EXCHANGE_SLOTS

    for pair_number, (next_source, next_destination) in enumerate(
        zip(buffered_sources, buffered_destinations),
        start=2,
    ):
        next_source_slot = SOURCE_BUFFER_SLOTS[pair_number - 2]
        next_destination_slot = DESTINATION_BUFFER_SLOTS[pair_number - 2]

        # Clear A1/A2 by parking the completed pair in the current empty slots.
        protocol.move_labware(
            labware=source_work_rack,
            new_location=source_output_slot,
            use_gripper=True,
        )
        protocol.move_labware(
            labware=destination_work_rack,
            new_location=destination_output_slot,
            use_gripper=True,
        )

        # Move the next input pair onto the two required adapter stations.
        protocol.move_labware(
            labware=next_source,
            new_location=source_adapter,
            use_gripper=True,
        )
        protocol.move_labware(
            labware=next_destination,
            new_location=destination_adapter,
            use_gripper=True,
        )

        split_pair(next_source, next_destination, pair_number)

        source_work_rack = next_source
        destination_work_rack = next_destination
        source_output_slot = next_source_slot
        destination_output_slot = next_destination_slot

    # The seventh pair remains on A1/A2. All other completed pairs occupy the
    # rolling slots. The deck now holds fourteen finished 48-tip racks.
    protocol.comment(
        "Complete: seven full racks were split into fourteen 48-tip racks. "
        "The final pair remains on A1/A2; the other twelve outputs occupy the "
        "buffer and expansion positions."
    )
