from opentrons import protocol_api
from opentrons.protocol_api import COLUMN, ALL, SINGLE, ROW

requirements = {"robotType": "Flex", "apiLevel": "2.20"}


def run(protocol: protocol_api.ProtocolContext):
    pipette = protocol.load_instrument(instrument_name="flex_96channel_1000")
    trash = protocol.load_trash_bin("A1")
    t1 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="Partial Tip Rack",
        location="A2",
    )
    t2 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="Partial Tip Rack",
        location="B2",
    )
    t3 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="Partial Tip Rack",
        location="C2",
    )
    t4 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="Partial Tip Rack",
        location="D2",
    )

    ### Prep tipracks in B2 and D2 by removing 3 columns of tips
    pipette.configure_nozzle_layout(
        style=COLUMN,
        start="A1",
        tip_racks=[t2],
    )
    for i in range(3):
        pipette.pick_up_tip()
        pipette.drop_tip()

    pipette.configure_nozzle_layout(
        style=COLUMN,
        start="A1",
        tip_racks=[t4],
    )
    for i in range(3):
        pipette.pick_up_tip()
        pipette.drop_tip()

    ### Relocate tipracks to A3 and C3 for single tip extraction at furthest extant
    protocol.move_labware(t2, "A3", True)
    protocol.move_labware(t4, "C3", True)

    pipette.configure_nozzle_layout(
        style=SINGLE,
        start="A1",
        tip_racks=[t2, t4],
    )

    for i in range(72 * 2):
        pipette.pick_up_tip()
        pipette.drop_tip()

    ### Move tipracks out of the way to B1 and C1
    protocol.move_labware(t2, "B1", True)
    protocol.move_labware(t4, "C1", True)

    ### Prepare tiprack in A2 by removing 3 columns of tips
    pipette.configure_nozzle_layout(
        style=COLUMN,
        start="A1",
        tip_racks=[t1],
    )
    for i in range(3):
        pipette.pick_up_tip()
        pipette.drop_tip()

    ### Prepare tiprack in C2 by removing bottom 3 rows of tips, plus 15 tips (3 leftmost remaining columns)
    ### This results in a tiprack of the following layout (matching the requirements for our bottom right extents):
    #  X    X   X   X   X   X   X   X   X   -   -   -
    #  X    X   X   X   X   X   X   X   X   -   -   -
    #  X    X   X   X   X   X   X   X   X   -   -   -
    #  X    X   X   X   X   X   X   X   X   -   -   -
    #  X    X   X   X   X   X   X   X   X   -   -   -
    #   -   -   -   -   -   -   -   -   -   -   -   -
    #   -   -   -   -   -   -   -   -   -   -   -   -
    #   -   -   -   -   -   -   -   -   -   -   -   -
    pipette.configure_nozzle_layout(
        style=ROW,
        start="A1",
        tip_racks=[t3],
    )
    for i in range(3):
        pipette.pick_up_tip()
        pipette.drop_tip()

    pipette.configure_nozzle_layout(
        style=SINGLE,
        start="A1",
        tip_racks=[t3],
    )
    for i in range(15):
        pipette.pick_up_tip()
        pipette.drop_tip()

    ### Relocate tipracks to B3 and D3 on the deck
    protocol.move_labware(t1, "B3", True)
    protocol.move_labware(t3, "D3", True)

    pipette.configure_nozzle_layout(
        style=SINGLE,
        start="A1",
        tip_racks=[t1, t3],
    )

    for i in range(72 + 45):
        pipette.pick_up_tip()
        pipette.drop_tip()
