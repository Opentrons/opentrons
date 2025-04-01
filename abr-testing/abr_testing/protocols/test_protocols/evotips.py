"""ABR Evotips Test Protocol."""
from opentrons.types import Point
from opentrons.protocol_api import ProtocolContext, ParameterContext

metadata = {
    "protocolName": "Sample Clean-up by Evotips with 96-ch Pipette",
    "author": "Boren Lin, Opentrons",
    "description": "",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.22",
}

EVOSEP_TEMPORARY_OFFSET = 0
H_TIP_IN_WELL = 0


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    parameters.add_int(
        variable_name="gripper_repeats",
        display_name="Gripper Repeats",
        default=5,
        minimum=1,
        maximum=100,
    )
    parameters.add_float(
        variable_name="soak_seconds",
        display_name="Soak Seconds",
        default=30,
        minimum=1,
        maximum=60,
    )
    parameters.add_bool(
        variable_name="gripper_only", display_name="Gripper Only", default=True
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    evotips_adapter = protocol.load_adapter(
        "evotip_flex_96_tiprack_adapter", "C1"
    )
    evosep_tips_labware = evotips_adapter.load_labware(
        "evotip_flex_96_labware",
    )
    evotip = evosep_tips_labware.wells()[0]
    gripper_repeats = protocol.params.gripper_repeats  # type: ignore[attr-defined]
    soak_seconds = protocol.params.soak_seconds  # type: ignore[attr-defined]
    gripper_only = protocol.params.gripper_only  # type: ignore[attr-defined]
    soak_plate = protocol.load_adapter("evotip_flex_short_adapter", "B2")

    sol_a_plate = protocol.load_labware("nest_1_reservoir_195ml", "C2","Solvent A")
    sol_a = sol_a_plate.wells()[0]

    sample_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "D2", "Samples"
    )
    sample = sample_plate.wells()[0]
    protocol.load_trash_bin("D3")
    if not gripper_only:
        tips_200 = protocol.load_labware(
            "opentrons_flex_96_tiprack_200ul",
            "B1",
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
            for slot in ["C3", "B3"]
        ]

        p1k_96 = protocol.load_instrument("flex_96channel_1000")

        # adding 15 uL and then 20 uL

        p1k_96.tip_racks = tips_50
        p1k_96.pick_up_tip()
        protocol.pause("Check Tip Alignment")

        p1k_96.flow_rate.aspirate = 20
        p1k_96.flow_rate.dispense = 5

        p1k_96.aspirate(15 + 2, sol_a.bottom(z=2))
        protocol.delay(seconds=1)

        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

        p1k_96.dispense(15, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 38))  # -36
        protocol.delay(seconds=1)
        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 33), speed=0.5)  # -31
        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET + 5))

        p1k_96.return_tip()

        p1k_96.pick_up_tip()

        p1k_96.aspirate(20, sample.bottom(z=1))
        protocol.delay(seconds=1)

        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

        p1k_96.dispense(20, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 28))  # -27
        protocol.delay(seconds=1)
        p1k_96.move_to(evotip.top(EVOSEP_TEMPORARY_OFFSET - 23), speed=2)  # -22
        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET + 5))

        # protocol.pause(' ')

        p1k_96.return_tip()

        # adding 150 uL

        H = 20
        D = 1

        p1k_96.tip_racks = [tips_200]
        p1k_96.pick_up_tip()

        p1k_96.flow_rate.aspirate = 200
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

        # p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET-H))
        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

        # p1k_96.move_to(tips_200.wells()[0].top(z=40))
        protocol.pause("Check for 3 distinct layers.")

        p1k_96.return_tip()

        # ------------------------Soak tips Action ------------------------------

        # protocol.move_labware(evosep_tips_labware, soak_plate, True)
        # protocol.delay(SEC_SOAK)
        # protocol.move_labware(evosep_tips_labware, evotips_adapter, True)
    for i in range(gripper_repeats):
        protocol.move_labware(
            labware=evosep_tips_labware,
            new_location=soak_plate,
            use_gripper=True,
        )
        protocol.move_labware(
            labware=evosep_tips_labware,
            new_location=evotips_adapter,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 0},
        )

    protocol.delay(seconds=soak_seconds)

    # ------------------------End Gripper Action ---------------------------
    if not gripper_only:
        # Seal the pipette to the evotips
        p1k_96.resin_tip_seal(location=evosep_tips_labware)

        p1k_96.resin_tip_dispense(
            location=evotip.top(z=H_TIP_IN_WELL + 10), volume=300.0, rate=100.0
        )
        # protocol.delay(seconds=20)
        p1k_96.resin_tip_dispense(
            location=evotip.top(z=H_TIP_IN_WELL + 10), volume=100.0, rate=1.0
        )
        protocol.delay(seconds=30)

        # Unseal/eject the Evo Tips
        p1k_96.resin_tip_unseal(evosep_tips_labware)
