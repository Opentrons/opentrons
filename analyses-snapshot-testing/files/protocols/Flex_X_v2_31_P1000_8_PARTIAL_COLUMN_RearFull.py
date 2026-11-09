from opentrons.protocol_api import PARTIAL_COLUMN

metadata = {
    "protocolName": "Rear partial column cannot be a full column",
    "description": "A1-H1 is outside the new rear partial-column maps.",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.31",
}


def run(protocol):
    """A1-G1 is the longest new map. A1-H1 must still fail at configure time.

    Expected error: a partial column with start A1 cannot end in row H.
    Use ALL to use every nozzle. This rejection happens before any tip rack is used.
    """
    protocol.load_trash_bin("A3")
    tiprack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "B2")
    source = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "B1")
    destination = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "C1")
    pipette = protocol.load_instrument("flex_8channel_1000", "left")
    pipette.configure_nozzle_layout(
        style=PARTIAL_COLUMN,
        start="A1",
        end="H1",
        tip_racks=[tiprack],
    )
    pipette.transfer(10, source["A1"], destination["A1"])
