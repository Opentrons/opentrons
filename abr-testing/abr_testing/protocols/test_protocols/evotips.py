"""Evotips Clean-up with 96-channel Pipette."""
from opentrons.types import Point
from opentrons.protocol_api import ProtocolContext, ParameterContext
from abr_testing.protocols import helpers

metadata = {
    "protocolName": "Sample Clean-up by Evotips with 96-ch Pipette",
    "author": "Boren Lin, Opentrons",
    "description": "",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    parameters.add_bool(
        variable_name="test",
        display_name="Test Run",
        description=("Protocol paused at several check points "),
        default=True,
    )
    parameters.add_str(
        variable_name="labware_sample",
        display_name="Sample Labware",
        description=" ",
        default="opentrons_96_wellplate_200ul_pcr_full_skirt",
        choices=[
            {
                "display_name": "200µL PCR 96-well Plate",
                "value": "opentrons_96_wellplate_200ul_pcr_full_skirt",
            },
            {
                "display_name": "2mL 96-Well Plate ",
                "value": "nest_96_wellplate_2ml_deep",
            },
        ],
    )
    parameters.add_int(
        variable_name="slot_sample",
        display_name="Sample Location",
        description=" ",
        default=3,
        choices=[
            {"display_name": "Slot A1", "value": 0},
            {"display_name": "Slot B1", "value": 1},
            {"display_name": "Slot C1", "value": 2},
            {"display_name": "Slot D1", "value": 3},
            {"display_name": "Slot A3", "value": 4},
            {"display_name": "Slot B3", "value": 5},
            {"display_name": "Slot C3", "value": 6},
        ],
    )
    parameters.add_str(
        variable_name="labware_solvent",
        display_name="Solvent A Labware",
        description=" ",
        default="nest_1_reservoir_195ml",
        choices=[
            {"display_name": "195mL Reservoir", "value": "nest_1_reservoir_195ml"},
            {
                "display_name": "2mL 96-Well Plate ",
                "value": "nest_96_wellplate_2ml_deep",
            },
        ],
    )
    parameters.add_int(
        variable_name="slot_solvent",
        display_name="Solvent A Location",
        description=" ",
        default=2,
        choices=[
            {"display_name": "Slot A1", "value": 0},
            {"display_name": "Slot B1", "value": 1},
            {"display_name": "Slot C1", "value": 2},
            {"display_name": "Slot D1", "value": 3},
            {"display_name": "Slot A3", "value": 4},
            {"display_name": "Slot B3", "value": 5},
            {"display_name": "Slot C3", "value": 6},
        ],
    )
    parameters.add_int(
        variable_name="slot_soaking",
        display_name="Soaking Plate Location",
        description=" ",
        default=1,
        choices=[
            {"display_name": "Slot A1", "value": 0},
            {"display_name": "Slot B1", "value": 1},
            {"display_name": "Slot C1", "value": 2},
            {"display_name": "Slot D1", "value": 3},
            {"display_name": "Slot A3", "value": 4},
            {"display_name": "Slot B3", "value": 5},
            {"display_name": "Slot C3", "value": 6},
        ],
    )
    parameters.add_int(
        variable_name="vol_extra",
        display_name="Extra Solvent A",
        description="Add Extra Solvent A for Storage? Enter '0' if not applicable",
        default=250,
        choices=[
            {"display_name": "0", "value": 0},
            {"display_name": "50µL", "value": 50},
            {"display_name": "100µL", "value": 100},
            {"display_name": "150µL", "value": 150},
            {"display_name": "200µL", "value": 200},
            {"display_name": "250µL", "value": 250},
        ],
    )
    parameters.add_int(
        variable_name="type_dumpster",
        display_name="Tip Disposal",
        description=" ",
        default=2,
        choices=[
            {"display_name": "Trash Bin", "value": 1},
            {"display_name": "Waste Chute", "value": 2},
            {"display_name": "Returned to tiprack", "value": 3},
        ],
    )


SEC_SOAK = 30
EVOSEP_TEMPORARY_OFFSET = 0.5
RATE = 100.0
DELAY = 30


def run(protocol: ProtocolContext) -> None:
    """Main function to run the protocol."""
    test = protocol.params.test  # type: ignore[attr-defined]
    labware_sample = protocol.params.labware_sample  # type: ignore[attr-defined]
    slot_sample = protocol.params.slot_sample  # type: ignore[attr-defined]
    labware_solvent = protocol.params.labware_solvent  # type: ignore[attr-defined]
    slot_solvent = protocol.params.slot_solvent  # type: ignore[attr-defined]
    slot_soaking = protocol.params.slot_soaking  # type: ignore[attr-defined]
    type_dumpster = protocol.params.type_dumpster  # type: ignore[attr-defined]
    vol_extra = protocol.params.vol_extra  # type: ignore[attr-defined]
    if not protocol.is_simulating():
        slack_bot = helpers.set_up_slack()
        slack_bot.send_run_started_message(metadata["protocolName"])

    if test:
        h_tip_in_well = -10
    else:
        h_tip_in_well = -35

    open_slot = ["A1", "B1", "C1", "D1", "A3", "B3", "C3"]

    sample_plate = protocol.load_labware(
        labware_sample, open_slot[slot_sample], "Samples"
    )
    sample = sample_plate.wells()[0]

    sol_a_plate = protocol.load_labware(
        labware_solvent, open_slot[slot_solvent], "Solvent A"
    )
    sol_a = sol_a_plate.wells()[0]

    soak_plate = protocol.load_adapter(
        "ev_resin_tips_flex_short_adapter", open_slot[slot_soaking]
    )

    if type_dumpster == 1:
        protocol.load_trash_bin("D3")
    elif type_dumpster == 2:
        protocol.load_waste_chute()

    evotips_adapter = protocol.load_adapter(
        "ev_resin_tips_flex_96_tiprack_adapter", "D2"
    )
    evosep_tips_labware = evotips_adapter.load_labware(
        "ev_resin_tips_flex_96_labware", "EV Resin Tips"
    )
    evotip = evosep_tips_labware.wells()[0]

    tips_200 = protocol.load_labware(
        "opentrons_flex_96_tiprack_200ul",
        "A2",
        "200uL tips",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    tips_50 = [
        protocol.load_labware(
            "opentrons_flex_96_tiprack_50ul",
            slot,
            "50uL tips",
            adapter="opentrons_flex_96_tiprack_adapter",
        )
        for slot in ["C2", "B2"]
    ]

    p1k_96 = protocol.load_instrument("flex_96channel_1000")
    try:
        # adding 15 uL and then 20 uL

        p1k_96.tip_racks = tips_50
        p1k_96.pick_up_tip()

        p1k_96.flow_rate.aspirate = 6
        p1k_96.flow_rate.dispense = 6

        p1k_96.aspirate(15 + 2, sol_a.bottom(z=2))
        protocol.delay(seconds=1)

        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

        if test:
            protocol.pause("")

        p1k_96.dispense(15, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 39))  # -36
        protocol.delay(seconds=1)
        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 34), speed=0.5)  # -31
        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET + 5))

        if type_dumpster == 3:
            p1k_96.return_tip()
        else:
            p1k_96.drop_tip()

        p1k_96.pick_up_tip()

        p1k_96.aspirate(20, sample.bottom(z=1))
        protocol.delay(seconds=1)

        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

        p1k_96.dispense(
            20, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 30), push_out=0
        )  # -27
        protocol.delay(seconds=1)
        p1k_96.move_to(evotip.top(EVOSEP_TEMPORARY_OFFSET - 25), speed=2)  # -22
        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET + 5))

        if type_dumpster == 3:
            p1k_96.return_tip()
        else:
            p1k_96.drop_tip()

        if test:
            protocol.pause("")

        # adding 150 uL

        H = 20
        D = 1

        p1k_96.tip_racks = [tips_200]
        p1k_96.pick_up_tip()

        p1k_96.flow_rate.aspirate = 80
        p1k_96.aspirate(150, sol_a.bottom(z=2))
        protocol.delay(seconds=1)

        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

        p1k_96.flow_rate.dispense = 2
        p1k_96.dispense(50, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - H).move(Point(x=D)))
        p1k_96.flow_rate.dispense = 8
        p1k_96.move_to(
            evotip.top(z=EVOSEP_TEMPORARY_OFFSET - H).move(Point(x=0)), speed=5
        )
        p1k_96.move_to(
            evotip.top(z=EVOSEP_TEMPORARY_OFFSET - H + 5).move(Point(x=0)), speed=5
        )
        p1k_96.dispense(
            100, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - H + 5).move(Point(x=0))
        )
        protocol.delay(seconds=1)

        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

        if vol_extra == 0:
            if type_dumpster == 3:
                p1k_96.return_tip()
            else:
                p1k_96.drop_tip()
        else:
            p1k_96.return_tip()
            p1k_96.reset_tipracks()

        if test:
            protocol.pause("")

        # soaking tips

        protocol.move_labware(
            labware=evosep_tips_labware,
            new_location=soak_plate,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 0},
            drop_offset={"x": 0, "y": 0, "z": 0},
        )

        if test:
            protocol.pause(" ")
        else:
            protocol.delay(seconds=SEC_SOAK)

        protocol.move_labware(
            labware=evosep_tips_labware,
            new_location=evotips_adapter,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 0},
            drop_offset={"x": 0, "y": 0, "z": 0},
        )

        # sealing tips

        # Seal the pipette to the evotips
        p1k_96.resin_tip_seal(location=evosep_tips_labware)

        # Dispense
        p1k_96.resin_tip_dispense(
            location=evotip.top(z=h_tip_in_well), volume=400.0, rate=RATE
        )
        p1k_96.resin_tip_dispense(
            location=evotip.top(z=h_tip_in_well), volume=100.0, rate=1.0
        )
        protocol.delay(seconds=DELAY)

        # Unseal/eject the Evo Tips
        p1k_96.resin_tip_unseal(evosep_tips_labware)

        # adding extra

        if vol_extra > 0:

            if test:
                protocol.pause(" ")

            p1k_96.tip_racks = [tips_200]
            p1k_96.pick_up_tip()

            p1k_96.flow_rate.aspirate = 80
            p1k_96.flow_rate.dispense = 80

            if vol_extra < 200:
                p1k_96.aspirate(vol_extra, sol_a.bottom(z=2))
                protocol.delay(seconds=1)
                p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))
                p1k_96.dispense(vol_extra, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 2))
                protocol.delay(seconds=1)
            else:
                p1k_96.aspirate(200, sol_a.bottom(z=2))
                protocol.delay(seconds=1)
                p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))
                p1k_96.dispense(200, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 2))
                protocol.delay(seconds=1)
                p1k_96.aspirate(vol_extra - 200, sol_a.bottom(z=2))
                protocol.delay(seconds=1)
                p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))
                p1k_96.dispense(
                    vol_extra - 200, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 2)
                )
                protocol.delay(seconds=1)

            if type_dumpster == 3:
                p1k_96.return_tip()
            else:
                p1k_96.drop_tip()
        if not protocol.is_simulating():
            slack_bot.send_run_completed_message(metadata["protocolName"])
    except Exception as e:
        if not protocol.is_simulating():
            slack_bot.send_error_message(metadata["protocolName"], str(e))
        raise (e)
