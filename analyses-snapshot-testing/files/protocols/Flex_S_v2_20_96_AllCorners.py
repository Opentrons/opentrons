from opentrons import protocol_api
from opentrons.protocol_api import COLUMN, SINGLE, ROW

requirements = {"robotType": "Flex", "apiLevel": "2.20"}


def run(protocol: protocol_api.ProtocolContext):
    pipette = protocol.load_instrument(instrument_name="flex_96channel_1000")
    trash = protocol.load_trash_bin("B3")
    t1 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="A1 Corner Tiprack 1",
        location="B1",
    )
    t2 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="D1 Corner Tiprack",
        location="C1",
    )
    t3 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="A3 Corner Tiprack 1",
        location="B2",
    )
    t4 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="D3 Corner Tiprack",
        location="C2",
    )
    t5 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="A3 Corner Tiprack 2",
        location="A2",
    )
    t6 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="A1 Corner Tiprack 2",
        location="D4",
    )

    ### SETUP TIPRACK FUNCTIONS
    # These functions serve the purpose of removing tips from a tiprack before it is moved to a corner slot
    # This is done to ensure the tiprack is in such a state that it will trigger zero deck extent conflicts

    # Setup T2
    def t2_setup() -> None:
        pipette.configure_nozzle_layout(
            style=ROW,
            start="A1",
            tip_racks=[t2],
        )
        for i in range(3):
            pipette.pick_up_tip()
            pipette.drop_tip()

    # Setup T3
    def t3_setup() -> None:
        pipette.configure_nozzle_layout(style=COLUMN, start="A1", tip_racks=[t3])
        for i in range(2):
            pipette.pick_up_tip()
            pipette.drop_tip()

    # Setup T4
    def t4_setup() -> None:
        pipette.configure_nozzle_layout(
            style=ROW,
            start="A1",
            tip_racks=[t4],
        )
        for i in range(3):
            pipette.pick_up_tip()
            pipette.drop_tip()

        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="A1",
            tip_racks=[t4],
        )
        for i in range(10):
            pipette.pick_up_tip()
            pipette.drop_tip()

    # Setup T5
    def t5_setup() -> None:
        pipette.configure_nozzle_layout(
            style=ROW,
            start="H1",
            tip_racks=[t5],
        )
        for i in range(7):
            pipette.pick_up_tip()
            pipette.drop_tip()

        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="A1",
            tip_racks=[t5],
        )
        for i in range(2):
            pipette.pick_up_tip()
            pipette.drop_tip()

    # Setup T6
    def t6_setup() -> None:
        pipette.configure_nozzle_layout(
            style=ROW,
            start="H1",
            tip_racks=[t6],
        )
        for i in range(7):
            pipette.pick_up_tip()
            pipette.drop_tip()

    ### PICKUP TIP FUNCTIONS
    # These functions perform pickup tip behavior for a given tiprack

    # Pickup T2
    def t1_pickup() -> None:
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="A1",
            tip_racks=[t1],
        )
        for i in range(48):
            pipette.pick_up_tip()
            pipette.drop_tip()
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="A12",
            tip_racks=[t1],
        )
        for i in range(48):
            pipette.pick_up_tip()
            pipette.drop_tip()

    # Pickup T2
    def t2_pickup() -> None:
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="A1",
            tip_racks=[t2],
        )
        for i in range(15):
            pipette.pick_up_tip()
            pipette.drop_tip()
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="A12",
            tip_racks=[t2],
        )
        for i in range(15):
            pipette.pick_up_tip()
            pipette.drop_tip()
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="H1",
            tip_racks=[t2],
        )
        for i in range(15):
            pipette.pick_up_tip()
            pipette.drop_tip()
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="H12",
            tip_racks=[t2],
        )
        for i in range(15):
            pipette.pick_up_tip()
            pipette.drop_tip()

    # Pickup T3
    def t3_pickup() -> None:
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="A1",
            tip_racks=[t3],
        )
        for i in range(40):
            pipette.pick_up_tip()
            pipette.drop_tip()
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="A12",
            tip_racks=[t3],
        )
        for i in range(40):
            pipette.pick_up_tip()
            pipette.drop_tip()

    # Pickup T4
    def t4_pickup() -> None:
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="A1",
            tip_racks=[t4],
        )
        for i in range(10):
            pipette.pick_up_tip()
            pipette.drop_tip()
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="A12",
            tip_racks=[t4],
        )
        for i in range(10):
            pipette.pick_up_tip()
            pipette.drop_tip()
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="H1",
            tip_racks=[t4],
        )
        for i in range(15):
            pipette.pick_up_tip()
            pipette.drop_tip()
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="H12",
            tip_racks=[t4],
        )
        for i in range(15):
            pipette.pick_up_tip()
            pipette.drop_tip()

    # Pickup T5
    def t5_pickup() -> None:
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="H1",
            tip_racks=[t5],
        )
        for i in range(5):
            pipette.pick_up_tip()
            pipette.drop_tip()
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="H12",
            tip_racks=[t5],
        )
        for i in range(5):
            pipette.pick_up_tip()
            pipette.drop_tip()

    # Pickup T6
    def t6_pickup() -> None:
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="H1",
            tip_racks=[t6],
        )
        for i in range(6):
            pipette.pick_up_tip()
            pipette.drop_tip()
        pipette.configure_nozzle_layout(
            style=SINGLE,
            start="H12",
            tip_racks=[t6],
        )
        for i in range(6):
            pipette.pick_up_tip()
            pipette.drop_tip()

    ### Protocol Actions
    # Perform Setup of first set of tipracks
    protocol.move_labware(t1, "A1", True)
    t2_setup()
    protocol.move_labware(t2, "D1", True)
    t3_setup()
    protocol.move_labware(t3, "A3", True)
    t4_setup()
    protocol.move_labware(t4, "D3", True)

    # Clear out T2 first to make room for T5
    t2_pickup()
    protocol.move_labware(t5, "B2", True)
    t5_setup()
    protocol.move_labware(t5, "C1", True)

    # Clear out T1, T3, and T4
    t1_pickup()
    t3_pickup()
    protocol.move_labware(t6, "A4", True)
    t4_pickup()
    protocol.move_labware(t6, "D4", True)

    # Move T3, then move and handle T5
    protocol.move_labware(t3, "D2", True)
    protocol.move_labware(t5, "A3", True)
    t5_pickup()

    # Move T6 to On-Deck in B2 and setup, then move to A1 and handle
    protocol.move_labware(t6, "B2", True)
    t6_setup()
    protocol.move_labware(t1, "C3", True)
    protocol.move_labware(t6, "A1", True)
    t6_pickup()
