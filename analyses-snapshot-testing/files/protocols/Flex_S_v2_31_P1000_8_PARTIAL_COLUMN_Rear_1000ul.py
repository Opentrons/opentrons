from opentrons.protocol_api import PARTIAL_COLUMN

metadata = {
    "protocolName": "Rear partial column 1000 uL tips",
    "description": "Rear partial column on a 1000 uL tip rack, automatic and named pickups.",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.32",
}


def run(protocol):
    """Succeed with the new rear partial-column maps on this tip rack.

    Pickups alternate automatic tracking and a named well, and the nozzle map changes each time:
    A1-B1 automatic, A1-D1 named, A1-G1 automatic again.
    After each pickup the protocol checks that exactly the expected tip wells were consumed.
    """
    protocol.load_trash_bin("A3")
    tiprack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "B2")
    source = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "B1")
    destination = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "C1")
    pipette = protocol.load_instrument("flex_8channel_1000", "left")

    def require_used_tips(expected_empty):
        """Fail analysis unless columns 1-3 match the wells this pickup should have used."""
        expected = set(expected_empty)
        actual = {
            f"{row}{column}"
            for column in "123"
            for row in "ABCDEFGH"
            if not tiprack[f"{row}{column}"].has_tip
        }
        if actual != expected or not pipette.has_tip:
            raise RuntimeError(
                "Tip rack wells did not match the expected pickup. "
                f"Unexpectedly empty: {sorted(actual - expected)}. "
                f"Still had tips: {sorted(expected - actual)}. "
                f"Pipette has tip: {pipette.has_tip}."
            )

    pipette.configure_nozzle_layout(
        style=PARTIAL_COLUMN,
        start="A1",
        end="B1",
        tip_racks=[tiprack],
    )
    # Automatic: 2 nozzles, next tips are G1 and H1.
    pipette.pick_up_tip()
    require_used_tips(["G1", "H1"])
    pipette.aspirate(10, source["A1"])
    pipette.dispense(10, destination["A1"])
    pipette.drop_tip()

    pipette.configure_nozzle_layout(
        style=PARTIAL_COLUMN,
        start="A1",
        end="D1",
        tip_racks=[tiprack],
    )
    # Named well: 4 nozzles, A3 through D3.
    pipette.pick_up_tip(tiprack["A3"])
    require_used_tips(["G1", "H1", "A3", "B3", "C3", "D3"])
    pipette.aspirate(10, source["A3"])
    pipette.dispense(10, destination["A3"])
    pipette.drop_tip()

    pipette.configure_nozzle_layout(
        style=PARTIAL_COLUMN,
        start="A1",
        end="G1",
        tip_racks=[tiprack],
    )
    # Automatic again: 7 nozzles skip column 1 and take B2 through H2.
    pipette.pick_up_tip()
    require_used_tips(
        ["G1", "H1", "A3", "B3", "C3", "D3", "B2", "C2", "D2", "E2", "F2", "G2", "H2"]
    )
    pipette.aspirate(10, source["A1"])
    pipette.dispense(10, destination["A1"])
    pipette.drop_tip()
