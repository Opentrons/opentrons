"""Split four fixed source/destination tip-rack pairs without the Gripper.

Layout
------
    A2, B2, C2, D2: physically full source racks, each on a 96-channel adapter.
    A3, B3, C3, D3: physically empty destination racks, each on a 96-channel
                     adapter in a standard deck slot.

Transfer mapping
----------------
    A2 -> A3
    B2 -> B3
    C2 -> C3
    D2 -> D3

The Flex Gripper is not loaded or used. Flex Stackers must not be installed or
loaded, because pipettes cannot access labware on a Stacker shuttle.

This protocol is ONLY for a mechanically modified Flex 96-channel pipette whose
remaining physical nozzles are rows B, C, E, and H (48 nozzles total). Software
remains in normal ALL-nozzle mode.
"""

from opentrons import protocol_api


requirements = {
    "robotType": "Flex",
    "apiLevel": "2.25",
}

metadata = {
    "protocolName": "Mechanical 48-Nozzle Split - Four Fixed Pairs - No Gripper",
    "author": "OpenAI Codex",
    "description": (
        "Direct fixed-position distribution A2->A3, B2->B3, C2->C3, D2->D3. "
        "Supports selectable T50, T200, and T1000 racks without Gripper motion."
    ),
}


PIPETTE_LOAD_NAME = "flex_96channel_1000"
TIPRACK_ADAPTER_LOAD_NAME = "opentrons_flex_96_tiprack_adapter"
TIPRACK_BY_TYPE = {
    "T50": "opentrons_flex_96_tiprack_50ul",
    "T200": "opentrons_flex_96_tiprack_200ul",
    "T1000": "opentrons_flex_96_tiprack_1000ul",
}

ROWS = ("A", "B", "C", "D")


def add_parameters(parameters: protocol_api.Parameters) -> None:
    """Add the rack type selector shown before the run."""
    parameters.add_str(
        variable_name="tip_type",
        display_name="针管类型 / Tip Type",
        description="选择本次四组位置使用的统一针管类型。",
        default="T1000",
        choices=[
            {"display_name": "T50 (50 µL)", "value": "T50"},
            {"display_name": "T200 (200 µL)", "value": "T200"},
            {"display_name": "T1000 (1000 µL)", "value": "T1000"},
        ],
    )


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Run four direct 48-tip splits with no labware movement."""

    tip_type = protocol.params.tip_type
    tiprack_load_name = TIPRACK_BY_TYPE[tip_type]

    protocol.comment(
        f"Selected physical type {tip_type}: all eight racks must match. "
        f"Software rack definition: {tiprack_load_name}."
    )
    protocol.comment(
        "No Gripper and no Stackers are used. All racks remain "
        "at their starting positions for the entire run."
    )

    pipette = protocol.load_instrument(PIPETTE_LOAD_NAME, "left")

    # Full source racks on fixed adapters in column 2.
    source_racks = {
        row: protocol.load_labware(
            tiprack_load_name,
            f"{row}2",
            label=f"{tip_type} full source {row}2",
            adapter=TIPRACK_ADAPTER_LOAD_NAME,
        )
        for row in ROWS
    }

    # Empty destination racks on fixed adapters in standard column-3 deck slots.
    destination_racks = {
        row: protocol.load_labware(
            load_name=tiprack_load_name,
            location=f"{row}3",
            adapter=TIPRACK_ADAPTER_LOAD_NAME,
            label=f"{tip_type} empty destination {row}3",
        )
        for row in ROWS
    }

    for pair_number, row in enumerate(ROWS, start=1):
        source_rack = source_racks[row]
        destination_rack = destination_racks[row]

        protocol.comment(
            f"Pair {pair_number}/4: {row}2 -> {row}3, mechanically transferring "
            "48 tips from rows B, C, E, and H."
        )

        # Do not call configure_nozzle_layout(). The arbitrary 48-nozzle layout
        # is determined solely by the physical pipette modification.
        pipette.pick_up_tip(source_rack["A1"])
        pipette.drop_tip(destination_rack["A1"])

    protocol.comment(
        "Complete: four full racks and four empty racks became eight 48-tip racks."
    )
