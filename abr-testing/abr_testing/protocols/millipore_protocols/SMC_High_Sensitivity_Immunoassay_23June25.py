"""SMC High Sensitivity Immunoassay - Sample Dilution."""
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
)
from opentrons.protocols.parameters.types import ParameterChoice
from typing import List

metadata = {
    "protocolName": "SMC High Sensitivity Immunoassay - Sample Dilution",
    "author": "Science Team, Opentrons",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameter Context."""
    # Mount selection
    parameters.add_str(
        variable_name="mount_single",
        display_name="P1000 1-ch Position",
        description="How P1000 single channel pipette is mounted?",
        default="left",
        choices=[
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
        ],
    )

    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        description="Skip delays, shorten mix steps, and return tips to racks",
        default=False,
    )

    dilution_ratios = [2, 4, 5, 8, 10, 20, 30, 50, 64, 100, 200, 300, 1000]

    choices: List[ParameterChoice] | None = [
        {"display_name": f"1:{value}", "value": value} for value in dilution_ratios
    ]

    parameters.add_int(
        variable_name="dil_ratio",
        display_name="Dilution Ratio",
        description="Ratio for sample dilution (e.g., 1:2 = 1 part sample 1 part diluent)",
        default=200,
        choices=choices,
    )

    parameters.add_int(
        variable_name="num_samples",
        display_name="Number of Samples",
        description="Number of samples to process (max 20 in triplicate)",
        default=20,
        minimum=1,
        maximum=20,
    )


def run(ctx: ProtocolContext) -> None:
    """Run."""
    mount_single = ctx.params.mount_single  # type: ignore[attr-defined]
    dry_run = (
        ctx.params.dry_run  # type: ignore[attr-defined]
    )  # minimizes incubation times and mix reps- also returns tip to box instead of trash
    dil_ratio = ctx.params.dil_ratio  # type: ignore[attr-defined]
    num_samples = ctx.params.num_samples  # type: ignore[attr-defined]

    ctx.load_trash_bin("A3")
    standard_plate = ctx.load_labware(
        "nest_96_wellplate_2ml_deep", "D2", "starting standards + sample plate"
    )
    sample_plate = ctx.load_labware("axygen_96_wellplate_500ul", "C3", "sample plate")

    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "B2", "reagents")

    tips_1000_2 = ctx.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul", "B3", "1000ul Tip Box"
    )

    S1000 = ctx.load_instrument(
        "flex_1channel_1000", mount_single, tip_racks=[tips_1000_2]
    )  # Single-channel pipette

    #      Placing Reagents     ###

    sample_diluent = reservoir.wells()[1:3]

    if num_samples > 12:
        dif = num_samples - 12
        samples = sample_plate.rows()[0][0:] + sample_plate.rows()[1][:dif]
    else:
        samples = sample_plate.rows()[0][:num_samples]

    #     Defining Liquids     ###

    liquids = [
        {"name": "samples", "description": "samples", "display_color": "#f833ff"},
    ]

    defined_liquids = {}
    for liquid in liquids:
        defined_liquids[liquid["name"]] = ctx.define_liquid(
            name=liquid["name"],
            description=liquid["description"],
            display_color=liquid["display_color"],
        )

    #      Loading Liquids      #####

    if dil_ratio in (30, 50, 64, 100):
        if num_samples > 10:
            vol_sd_1 = 12000
            vol_sd_2 = 5000
            def_sd_1 = ctx.define_liquid(
                name="Sample Diluent", description=" ", display_color="#9966FF"
            )  # light
            def_sd_2 = ctx.define_liquid(
                name="Sample Diluent", description=" ", display_color="#9966FF"
            )  # light
            reservoir.wells()[1].load_liquid(liquid=def_sd_1, volume=vol_sd_1)
            reservoir.wells()[2].load_liquid(liquid=def_sd_2, volume=vol_sd_2)
        else:
            vol_sd_1 = 8500
            def_sd_1 = ctx.define_liquid(
                name="Sample Diluent", description=" ", display_color="#9966FF"
            )  # light
            reservoir.wells()[1].load_liquid(liquid=def_sd_1, volume=vol_sd_1)
    elif dil_ratio in (200, 300, 1000):
        if num_samples > 10:
            vol_sd_1 = 12000
            vol_sd_2 = 12000
            def_sd_1 = ctx.define_liquid(
                name="Sample Diluent", description=" ", display_color="#9966FF"
            )  # light
            def_sd_2 = ctx.define_liquid(
                name="Sample Diluent", description=" ", display_color="#9966FF"
            )  # light
            reservoir.wells()[1].load_liquid(liquid=def_sd_1, volume=vol_sd_1)
            reservoir.wells()[2].load_liquid(liquid=def_sd_2, volume=vol_sd_2)
        else:
            vol_sd_1 = 10000
            vol_sd_2 = 5000
            def_sd_1 = ctx.define_liquid(
                name="Sample Diluent", description=" ", display_color="#9966FF"
            )  # light
            def_sd_2 = ctx.define_liquid(
                name="Sample Diluent", description=" ", display_color="#9966FF"
            )  # light
            reservoir.wells()[1].load_liquid(liquid=def_sd_1, volume=vol_sd_1)
            reservoir.wells()[2].load_liquid(liquid=def_sd_2, volume=vol_sd_2)
    elif dil_ratio in (2, 4, 5, 8):
        if num_samples > 10:
            vol_sd_1 = 8600
            def_sd_1 = ctx.define_liquid(
                name="Sample Diluent", description=" ", display_color="#9966FF"
            )  # light
            reservoir.wells()[1].load_liquid(liquid=def_sd_1, volume=vol_sd_1)
        else:
            vol_sd_1 = 5000
            def_sd_1 = ctx.define_liquid(
                name="Sample Diluent", description=" ", display_color="#9966FF"
            )  # light
            reservoir.wells()[1].load_liquid(liquid=def_sd_1, volume=vol_sd_1)
    elif dil_ratio in (10, 20):
        if num_samples >= 10:
            vol_sd_1 = 12000
            def_sd_1 = ctx.define_liquid(
                name="Sample Diluent", description=" ", display_color="#9966FF"
            )  # light
            reservoir.wells()[1].load_liquid(liquid=def_sd_1, volume=vol_sd_1)
        else:
            vol_sd_1 = 6100
            def_sd_1 = ctx.define_liquid(
                name="Sample Diluent", description=" ", display_color="#9966FF"
            )  # light
            reservoir.wells()[1].load_liquid(liquid=def_sd_1, volume=vol_sd_1)

    if dil_ratio == 30 or 50 or 64 or 100 or 200 or 300 or 1000:
        for well in samples:
            well.load_liquid(defined_liquids["samples"], volume=100)
    else:
        for well in samples:
            well.load_liquid(defined_liquids["samples"], volume=250)

    #                Creating Definition              ##########

    def slow_withdraw(
        pip: InstrumentContext, well: Well, delay_seconds: int = 1
    ) -> None:
        """Slow Withdraw."""
        ctx.delay(seconds=delay_seconds)
        pip.default_speed /= 10
        pip.move_to(well.top())
        pip.default_speed *= 10

    # New Code #######################
    # working on standards + Sample plate
    # sample_dil_scheme = { ratio: [manual sample input, sample in c1, diluent in c1,
    # sample from c1 into E1,
    # diluent from c1 into E1, sample from e1 into g1, diluent from e1 into g1] }
    sample_dil_scheme = {
        2: [250, 0, 0, 0, 0, 200, 200],
        4: [250, 0, 0, 0, 0, 100, 300],
        5: [100, 0, 0, 0, 0, 80, 320],
        8: [100, 0, 0, 0, 0, 50, 350],
        10: [100, 0, 0, 0, 0, 40, 360],
        20: [100, 35, 315, 0, 0, 200, 200],
        30: [100, 35, 315, 0, 0, 150, 300],
        50: [100, 35, 315, 0, 0, 80, 320],
        64: [100, 35, 315, 0, 0, 60, 324],
        100: [100, 35, 315, 0, 0, 40, 360],
        200: [100, 35, 315, 35, 315, 200, 200],
        300: [100, 35, 315, 35, 315, 150, 300],
        1000: [100, 35, 315, 35, 315, 40, 360],
    }

    intermediate = standard_plate
    mixes = 3 if not dry_run else 0
    scheme = sample_dil_scheme[dil_ratio]  # Which sample dilution scheme to use
    sample_src = (
        sample_plate.rows_by_name()["A"][:] + sample_plate.rows_by_name()["B"][:8]
    )[:num_samples]
    step1_src = (
        intermediate.rows_by_name()["C"][:] + intermediate.rows_by_name()["D"][:8]
    )[:num_samples]
    step2_src = (
        intermediate.rows_by_name()["E"][:] + intermediate.rows_by_name()["F"][:8]
    )[:num_samples]
    step3_src = (
        intermediate.rows_by_name()["G"][:] + intermediate.rows_by_name()["H"][:8]
    )[:num_samples]

    ctx.comment("--------Adding Diluent to the Reagent Plate --------")
    S1000.pick_up_tip(tips_1000_2)
    if scheme[1] > 0:
        ctx.comment(" ----- Performing Intermediate Dilution Step 1 -----")
        if dil_ratio in (20, 200):
            src_diluent = sample_diluent[0]

        elif dil_ratio in (30, 50, 64, 100):
            src_diluent = sample_diluent[1]
        elif dil_ratio in (300, 1000):
            if num_samples <= 10:
                src_diluent = sample_diluent[0]
            else:
                src_diluent = sample_diluent[1]
        dest = step1_src

        for d in dest:
            S1000.aspirate(scheme[2] + 1, src_diluent.bottom(1), rate=0.5)
            S1000.dispense(scheme[2] - 100, src_diluent.bottom(1), rate=0.5)
            S1000.aspirate(scheme[2] - 100, src_diluent.bottom(1), rate=0.5)
            S1000.dispense(scheme[2], d.bottom(1), rate=0.5)
            slow_withdraw(S1000, d)

        S1000.dispense(S1000.current_volume, reservoir.wells()[1].top(z=0))
        S1000.blow_out(reservoir.wells()[1].top(z=0))

    if scheme[3] > 0:
        ctx.comment(" ----- Performing Intermediate Dilution Step 2 -----")
        src_diluent = sample_diluent[1]

        for d in dest:
            S1000.aspirate(scheme[4] + 1, src_diluent.bottom(1), rate=0.5)
            S1000.dispense(scheme[4], d.bottom(1), rate=0.5)
            slow_withdraw(S1000, d)
        S1000.dispense(S1000.current_volume, reservoir.wells()[1])
        S1000.blow_out(reservoir.wells()[1])

    if scheme[5] > 0:
        ctx.comment(" ----- Performing Final Serial Dilution  -----")
        src_diluent = reservoir["A2"]
        dest = step3_src

        for d in dest:
            S1000.aspirate(scheme[6] + 1, src_diluent.bottom(1), rate=0.5)
            S1000.dispense(scheme[6], d.bottom(1), rate=0.5)
            slow_withdraw(S1000, d)
        S1000.dispense(S1000.current_volume, reservoir.wells()[1].top(z=0))
        S1000.blow_out(reservoir.wells()[1].top(z=0))

    S1000.drop_tip()

    ctx.comment("--------Adding Sample to the Reagent Plate --------")

    if scheme[1] == 0 and scheme[3] == 0 and scheme[5] > 0:
        ctx.comment(" ----- Performing Final Serial Dilution 1:2-1:10  -----")
        src_diluent = reservoir["A2"]
        dest = step3_src

        for s, d in zip(sample_src, dest):
            S1000.pick_up_tip()
            S1000.aspirate(scheme[5], s.bottom(1), rate=0.5)
            S1000.dispense(scheme[5], d.bottom(1), rate=0.5)
            S1000.mix(mixes, 300, d.bottom(1), rate=0.5)
            slow_withdraw(S1000, d)
            S1000.drop_tip()

    if scheme[1] > 0 and scheme[3] == 0 and scheme[5] > 0:
        ctx.comment(" ----- Performing Final Serial Dilution 1:20-1:100  -----")
        src_diluent = reservoir["A2"]
        dest = step1_src

        for s, d in zip(sample_src, dest):
            S1000.pick_up_tip()
            S1000.aspirate(scheme[1], s.bottom(1), rate=0.5)
            S1000.dispense(scheme[1], d.bottom(1), rate=0.5)
            S1000.mix(mixes, 300, d.bottom(1), rate=0.5)
            slow_withdraw(S1000, d)
            S1000.drop_tip()

        dest = step3_src

        for s2, d in zip(step1_src, dest):
            S1000.pick_up_tip()
            S1000.aspirate(scheme[5], s2.bottom(1), rate=0.5)
            S1000.dispense(scheme[5], d.bottom(1), rate=0.5)
            S1000.mix(mixes, 300, d.bottom(1), rate=0.5)
            slow_withdraw(S1000, d)
            S1000.drop_tip()

    if scheme[1] > 0 and scheme[3] > 0 and scheme[5] > 0:
        ctx.comment(" ----- Performing Final Serial Dilution 1:200-1:1000  -----")
        src_diluent = reservoir["A2"]
        dest = step1_src

        for s, d in zip(sample_src, dest):
            S1000.pick_up_tip()
            S1000.aspirate(scheme[1], s.bottom(1), rate=0.5)
            S1000.dispense(scheme[1], d.bottom(1), rate=0.5)
            S1000.mix(mixes, 300, d.bottom(1), rate=0.5)
            slow_withdraw(S1000, d)
            S1000.drop_tip()

        dest = step2_src

        for s2, d in zip(step1_src, dest):
            S1000.pick_up_tip()
            S1000.aspirate(scheme[1], s2.bottom(1), rate=0.5)
            S1000.dispense(scheme[1], d.bottom(1), rate=0.5)
            S1000.mix(mixes, 300, d.bottom(1), rate=0.5)
            slow_withdraw(S1000, d)
            S1000.drop_tip()

        dest = step3_src

        for s3, d in zip(step2_src, dest):
            S1000.pick_up_tip()
            S1000.aspirate(scheme[5], s3.bottom(1), rate=0.5)
            S1000.dispense(scheme[5], d.bottom(1), rate=0.5)
            S1000.mix(mixes, 300, d.bottom(1), rate=0.5)
            slow_withdraw(S1000, d)
            S1000.drop_tip()
