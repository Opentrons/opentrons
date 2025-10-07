"""Millipore Protocol: Human Cytokine Panel A - Day 1."""
from opentrons import types
from typing import List
from opentrons.protocol_api import ProtocolContext, ParameterContext, Well
from opentrons.protocol_api.module_contexts import HeaterShakerContext

metadata = {
    "protocolName": "Human Cytokine Panel A Milliplex Protocol - Day 1 w/meniscus and air gap",
    "author": "Science Team, Opentrons",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        description=("All incubation steps skipped and tips returned to tipracks"),
        default=True,
    )
    parameters.add_int(
        variable_name="num_sample",
        display_name="Number of Samples",
        description="Number of samples to be processed in duplicate (maximum: 38)",
        default=38,
        minimum=0,
        maximum=38,
    )
    parameters.add_int(
        variable_name="pipet_location",
        display_name="P1000 1-ch Position",
        description="How P1000 single channel pipette is mounted?",
        default=1,
        choices=[
            {"display_name": "on the right", "value": 1},
            {"display_name": "on the left", "value": 2},
        ],
    )


def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    dry_run = ctx.params.dry_run  # type: ignore[attr-defined]
    num_sample = ctx.params.num_sample  # type: ignore[attr-defined]
    pipet_location = ctx.params.pipet_location  # type: ignore[attr-defined]

    num_rxn = 20 + (num_sample * 2)
    # total wells in assay plate

    num_col = int(num_rxn // 8)

    if num_rxn % 8 != 0:
        num_col = num_col + 1
    # total columns in assay plate

    if pipet_location == 1:
        p1k_1_loc = "right"
        p1k_8_loc = "left"
    else:
        p1k_1_loc = "left"
        p1k_8_loc = "right"

    # deck layout

    hs: HeaterShakerContext = ctx.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    hs_adapter = hs.load_adapter("opentrons_universal_flat_adapter")
    assay_plate = hs_adapter.load_labware(
        "corning_96_wellplate_360ul_flat", "ASSAY PLATE"
    )
    assay_plate.load_empty(assay_plate.wells())
    bkgd_end: List[Well] = assay_plate.wells()[:2]
    std_end: List[Well] = assay_plate.wells()[2:16]
    qc1_end: List[Well] = assay_plate.wells()[16:18]
    qc2_end: List[Well] = assay_plate.wells()[18:20]
    if num_sample > 0:
        sample_end = assay_plate.wells()[20 : 20 + num_sample * 2]

    rxn_in_col: List[Well] = assay_plate.rows()[0][:num_col]
    rxn_in_well: List[Well] = assay_plate.wells()[:num_rxn]

    reagent_plate = ctx.load_labware(
        "nest_96_wellplate_2ml_deep", "D2", "REAGENT PLATE"
    )
    bkgd_start = reagent_plate.wells()[8]
    std_start = reagent_plate.wells()[9:16]
    qc1_start = reagent_plate.wells()[0]
    qc2_start = reagent_plate.wells()[1]
    if num_sample > 0:
        sample_start = reagent_plate.wells()[16 : 16 + num_sample]

    sm = reagent_plate.wells()[2]
    std_prep = reagent_plate.wells()[8:16]

    buffer_res = ctx.load_labware(
        "nest_12_reservoir_15ml", "C2", "ASSAY BUFFER, WASH BUFFER"
    )
    assay_buffer = buffer_res.wells()[0]
    wash = buffer_res.wells()[1:3]

    buffer_rack = ctx.load_labware(
        "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical", "B1", "BEAD SLURRY"
    )
    bead = buffer_rack.wells()[0]

    waste_plate = ctx.load_labware("nest_1_reservoir_290ml", "C1", "WASTE")
    waste = waste_plate.wells()[0]

    ctx.load_trash_bin("D3")

    tips_1k = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "C3", "1000uL TIPS")
    tips_200 = [
        ctx.load_labware("opentrons_flex_96_tiprack_200ul", slot, "200uL TIPS")
        for slot in ["B2", "B3"]
    ]

    p1k_1 = ctx.load_instrument("flex_1channel_1000", p1k_1_loc)
    p1k_8 = ctx.load_instrument("flex_8channel_1000", p1k_8_loc)

    # volume info

    if num_sample > 0:
        vol_sample = 25 * 2 + 50
        def_sample = ctx.define_liquid(
            name="Samples", description=" ", display_color="#50C878"
        )  # Green
        for well in range(num_sample):
            reagent_plate.wells()[16 + well].load_liquid(
                liquid=def_sample, volume=vol_sample
            )

    vol_qc = 25 * 2 + 50
    def_qc1 = ctx.define_liquid(
        name="QC1", description=" ", display_color="#8B8000"
    )  # Yellow
    def_qc2 = ctx.define_liquid(
        name="QC2", description=" ", display_color="#8B8000"
    )  # Yellow
    reagent_plate.wells()[0].load_liquid(liquid=def_qc1, volume=vol_qc)
    reagent_plate.wells()[1].load_liquid(liquid=def_qc2, volume=vol_qc)

    vol_sm = 25 * 20 + 50
    def_sm = ctx.define_liquid(
        name="Serum Matrix", description=" ", display_color="#FF0000"
    )  # Red
    reagent_plate.wells()[2].load_liquid(liquid=def_sm, volume=vol_sm)

    vol_std = 25 * 2 + 50 + 50
    def_std = ctx.define_liquid(
        name="Standard 7", description=" ", display_color="#FFA500"
    )  # Orange
    reagent_plate.wells()[15].load_liquid(liquid=def_std, volume=vol_std)

    if num_col > 6:
        vol_wash_1 = 10000
        vol_wash_2 = (num_col - 7) * 200 * 8 + 2000
        def_wash_1 = ctx.define_liquid(
            name="Wash Buffer", description=" ", display_color="#800080"
        )  # Purple
        def_wash_2 = ctx.define_liquid(
            name="Wash Buffer", description=" ", display_color="#800080"
        )  # Purple
        buffer_res.wells()[1].load_liquid(liquid=def_wash_1, volume=vol_wash_1)
        buffer_res.wells()[2].load_liquid(liquid=def_wash_2, volume=vol_wash_2)
    else:
        vol_wash_1 = num_col * 200 * 8 + 2000
        def_wash_1 = ctx.define_liquid(
            name="Wash Buffer", description=" ", display_color="#800080"
        )  # Purple
        buffer_res.wells()[1].load_liquid(liquid=def_wash_1, volume=vol_wash_1)

    vol_assay = (num_col - 3 - 1) * 25 * 8 + 2000 + 1500
    def_assay = ctx.define_liquid(
        name="Assay Buffer", description=" ", display_color="#99FFFF"
    )  # blue
    buffer_res.wells()[0].load_liquid(liquid=def_assay, volume=vol_assay)

    vol_bead = 25 * num_rxn + 50
    def_bead = ctx.define_liquid(
        name="Beads", description=" ", display_color="#808080"
    )  # Gray
    buffer_rack.wells()[0].load_liquid(liquid=def_bead, volume=vol_bead)

    # protocol

    ctx.pause(
        "Load Reagent Plate filled with QC1, QC2, Serum Matrix and Samples on Slot D2"
    )
    hs.open_labware_latch()
    ctx.pause("Load Assay Plate on Shaker")
    hs.close_labware_latch()

    # prepare working standards

    # add assay buffer
    p1k_1.tip_racks = [tips_1k]
    p1k_1.pick_up_tip()
    p1k_1.mix(1, 800, assay_buffer.bottom(z=5))
    for _ in range(2):
        p1k_1.aspirate(700, assay_buffer.meniscus(z=-1.5, target="end"))
        ctx.delay(seconds=1)
        for i in range(7):
            p1k_1.dispense(100, std_prep[i].bottom(z=10))
            ctx.delay(seconds=1)
    if dry_run:
        p1k_1.return_tip()
    else:
        p1k_1.drop_tip()

    # make serial dilutions
    p1k_1.tip_racks = tips_200
    for i in reversed(range(6)):
        p1k_1.pick_up_tip()
        p1k_1.mix(1, 50, std_prep[i + 2].bottom(z=2))
        p1k_1.aspirate(50, std_prep[i + 2].bottom(z=1))
        ctx.delay(seconds=1)
        p1k_1.dispense(50, std_prep[i + 1].bottom(z=10), push_out=10)
        p1k_1.mix(5, 50, std_prep[i + 1].bottom(z=2))
        p1k_1.blow_out(std_prep[i + 1].bottom(z=10))
        if dry_run:
            p1k_1.return_tip()
        else:
            p1k_1.drop_tip()

    # wash assay plate

    # add wash buffer
    p1k_8.tip_racks = tips_200
    p1k_8.pick_up_tip()
    if num_col > 6:
        p1k_8.mix(1, 200, wash[0])
        for col in range(6):
            p1k_8.aspirate(200, wash[0].meniscus(z=-1.5, target="end"))
            ctx.delay(seconds=1)
            p1k_8.dispense(200, rxn_in_col[col].top(z=-2))
            ctx.delay(seconds=1)
            d = rxn_in_col[col].diameter
            diameter: float = d if d is not None else 6.86
            p1k_8.move_to(
                rxn_in_col[col].top(z=-2).move(types.Point(x=diameter / 2.0 - 0.2))
            )

        p1k_8.mix(1, 200, wash[1])
        for col in range(num_col - 6):
            p1k_8.aspirate(200, wash[1].meniscus(z=-1.5, target="end"))
            ctx.delay(seconds=1)
            p1k_8.dispense(200, rxn_in_col[6 + col].top(z=-2))
            ctx.delay(seconds=1)
            d = rxn_in_col[6 + col].diameter
            diameter_1: float = d if d is not None else 6.86
            p1k_8.move_to(
                rxn_in_col[6 + col]
                .top(z=-2)
                .move(types.Point(x=diameter_1 / 2.0 - 0.2))
            )
    else:
        p1k_8.mix(1, 200, wash[0])
        for col in range(num_col):
            p1k_8.aspirate(200, wash[0].meniscus(z=-1.5, target="end"))
            ctx.delay(seconds=1)
            p1k_8.dispense(200, rxn_in_col[col].top(z=-2))
            ctx.delay(seconds=1)
            d = rxn_in_col[col].diameter
            diameter_2: float = d if d is not None else 6.86
            p1k_8.move_to(
                rxn_in_col[col].top(z=-2).move(types.Point(x=diameter_2 / 2 - 0.2))
            )
    if dry_run:
        p1k_8.return_tip()
    else:
        p1k_8.drop_tip()

    # shake
    hs.set_and_wait_for_shake_speed(rpm=1000)
    ctx.delay(minutes=0.1 if dry_run else 10)
    hs.deactivate_shaker()

    # discard wash buffer
    p1k_8.pick_up_tip()
    for col in range(num_col):
        p1k_8.move_to(rxn_in_col[col].top(z=0))
        p1k_8.aspirate(
            200,
            rxn_in_col[col].meniscus(z=-1.5, target="end"),
            rate=0.1,
        )
        ctx.delay(seconds=2)
        p1k_8.move_to(rxn_in_col[col].top(z=0))
        p1k_8.dispense(200, waste.top(z=-2))
        p1k_8.blow_out(waste.top(z=-2))
        ctx.delay(seconds=1)
    if dry_run:
        p1k_8.return_tip()
    else:
        p1k_8.drop_tip()

    # add serum matrix and assay buffer

    # add serum matrix
    p1k_1.tip_racks = [tips_1k]
    p1k_1.pick_up_tip()
    p1k_1.mix(1, 500, sm.bottom(z=2))
    p1k_1.aspirate(500, sm.bottom(z=1))
    ctx.delay(seconds=2)

    for well in range(20):
        p1k_1.dispense(25, rxn_in_well[well].bottom(z=5), rate=0.5)
        ctx.delay(seconds=1)
        d = rxn_in_well[well].diameter
        diameter_4: float = d if d is not None else 6.86
        p1k_1.move_to(
            rxn_in_well[well].top(z=-2).move(types.Point(x=diameter_4 / 2.0 - 0.3))
        )
    if dry_run:
        p1k_1.return_tip()
    else:
        p1k_1.drop_tip()

    # add assay buffer
    p1k_1.tip_racks = tips_200
    p1k_8.tip_racks = tips_200

    if num_sample > 0:

        if num_sample == 1:
            loc = [20, 21]
            p1k_1.pick_up_tip()
            p1k_1.mix(1, 25, assay_buffer.bottom(z=2))
            for well in loc:
                p1k_1.aspirate(25, assay_buffer.meniscus(z=-1.5, target="end"))
                p1k_1.air_gap(5)
                ctx.delay(seconds=2)
                p1k_1.dispense(5, rxn_in_well[well].top(), rate=0.5)
                p1k_1.dispense(25, rxn_in_well[well].bottom(z=5), rate=0.5)
                ctx.delay(seconds=1)
                d = rxn_in_well[well].diameter
                diameter_5: float = d if d is not None else 6.86
                p1k_1.move_to(
                    rxn_in_well[well]
                    .top(z=-2)
                    .move(types.Point(x=diameter_5 / 2 - 0.2))
                )
            if dry_run:
                p1k_1.return_tip()
            else:
                p1k_1.drop_tip()

        elif num_sample == 2:
            loc = [20, 21, 22, 23]
            p1k_1.pick_up_tip()
            p1k_1.mix(1, 25, assay_buffer.bottom(z=2))
            for well in loc:
                p1k_1.aspirate(25, assay_buffer.meniscus(z=-1.5, target="end"))
                p1k_1.air_gap(5)
                ctx.delay(seconds=2)
                p1k_1.dispense(5, rxn_in_well[well].top(), rate=0.5)
                p1k_1.dispense(25, rxn_in_well[well].bottom(z=5), rate=0.5)
                ctx.delay(seconds=1)
                d = rxn_in_well[well].diameter
                diameter_6: float = d if d is not None else 6.86
                p1k_1.move_to(
                    rxn_in_well[well]
                    .top(z=-2)
                    .move(types.Point(x=diameter_6 / 2 - 0.2))
                )
            if dry_run:
                p1k_1.return_tip()
            else:
                p1k_1.drop_tip()

        else:
            col = int(((num_sample - 2) * 2) // 8)
            res = (num_sample - 2) * 2 % 8

            loc = [20, 21, 22, 23]
            p1k_1.pick_up_tip()
            p1k_1.mix(1, 25, assay_buffer.bottom(z=2))
            for well in loc:
                p1k_1.aspirate(25, assay_buffer.meniscus(z=-1.5, target="end"))
                p1k_1.air_gap(5)
                ctx.delay(seconds=2)
                p1k_1.dispense(5, rxn_in_well[well].top(), rate=0.5)
                p1k_1.dispense(25, rxn_in_well[well].bottom(z=5), rate=0.5)
                ctx.delay(seconds=1)
                d = rxn_in_well[well].diameter
                diameter_7: float = d if d is not None else 6.86
                p1k_1.move_to(
                    rxn_in_well[well]
                    .top(z=-2)
                    .move(types.Point(x=diameter_7 / 2 - 0.2))
                )

            if res > 0:
                for i in range(res):
                    well = (col + 3) * 8 + i
                    p1k_1.aspirate(25, assay_buffer.meniscus(z=-1.5, target="end"))
                    p1k_1.air_gap(5)
                    ctx.delay(seconds=2)
                    p1k_1.dispense(5, rxn_in_well[well].top(), rate=0.5)
                    p1k_1.dispense(25, rxn_in_well[well].bottom(z=5), rate=0.5)
                    ctx.delay(seconds=1)
                    d = rxn_in_well[well].diameter
                    diameter_8: float = d if d is not None else 6.86
                    p1k_1.move_to(
                        rxn_in_well[well]
                        .top(z=-2)
                        .move(types.Point(x=diameter_8 / 2 - 0.2))
                    )
            if dry_run:
                p1k_1.return_tip()
            else:
                p1k_1.drop_tip()

            p1k_8.pick_up_tip()
            if col > 8:
                p1k_8.mix(1, 200, assay_buffer.bottom(z=2))
                p1k_8.aspirate(200, assay_buffer.meniscus(z=-1.5, target="end"))
                ctx.delay(seconds=2)
                for j in range(8):
                    p1k_8.dispense(25, rxn_in_col[3 + j].bottom(z=5), rate=0.5)
                    ctx.delay(seconds=1)
                    d = rxn_in_col[3 + j].diameter
                    diameter_9: float = d if d is not None else 6.86
                    p1k_8.move_to(
                        rxn_in_col[3 + j]
                        .top(z=-2)
                        .move(types.Point(x=diameter_9 / 2 - 0.2))
                    )

                p1k_8.aspirate(
                    25 * (col - 8), assay_buffer.meniscus(z=-1.5, target="end")
                )
                ctx.delay(seconds=2)
                for j in range(col - 8):
                    p1k_8.dispense(25, rxn_in_col[3 + 8 + j].bottom(z=5), rate=0.5)
                    ctx.delay(seconds=1)
                    d = rxn_in_col[3 + 8 + j].diameter
                    diameter_10: float = d if d is not None else 6.86
                    p1k_8.move_to(
                        rxn_in_col[3 + 8 + j]
                        .top(z=-2)
                        .move(types.Point(x=diameter_10 / 2 - 0.2))
                    )

            else:
                p1k_8.mix(1, 25 * col, assay_buffer.bottom(z=2))

                p1k_8.aspirate(25 * col, assay_buffer.meniscus(z=-1.5, target="end"))
                ctx.delay(seconds=2)
                for j in range(col):
                    p1k_8.dispense(25, rxn_in_col[3 + j].bottom(z=5), rate=0.5)
                    ctx.delay(seconds=1)
                    d = rxn_in_col[3 + j].diameter
                    diameter_11: float = d if d is not None else 6.86
                    p1k_8.move_to(
                        rxn_in_col[3 + j]
                        .top(z=-2)
                        .move(types.Point(x=diameter_11 / 2 - 0.2))
                    )

            if dry_run:
                p1k_8.return_tip()
            else:
                p1k_8.drop_tip()

    # transfer standards, QC and samples from reagent plate

    # add background
    p1k_1.tip_racks = tips_200

    p1k_1.pick_up_tip()
    p1k_1.mix(1, 25, bkgd_start.bottom(z=2))
    for i in range(2):
        p1k_1.aspirate(25, bkgd_start.bottom(z=1), rate=0.5)
        ctx.delay(seconds=1)
        p1k_1.dispense(25, bkgd_end[i].bottom(z=5), rate=0.5)
        d = bkgd_end[i].diameter
        diameter_12: float = d if d is not None else 6.86
        p1k_1.move_to(
            bkgd_end[i].top(z=-2).move(types.Point(x=-1 * (diameter_12 / 2 - 0.2)))
        )
    if dry_run:
        p1k_1.return_tip()
    else:
        p1k_1.drop_tip()

    # add standards
    for i, start in enumerate(std_start):
        p1k_1.pick_up_tip()
        p1k_1.mix(1, 25, start.bottom(z=2))
        for j in range(2):
            p1k_1.aspirate(25, start.bottom(z=1), rate=0.5)
            ctx.delay(seconds=1)
            p1k_1.dispense(25, std_end[i * 2 + j].bottom(z=5), rate=0.5)
            d = std_end[i * 2 + j].diameter
            diameter_13: float = d if d is not None else 6.86
            p1k_1.move_to(
                std_end[i * 2 + j]
                .top(z=-2)
                .move(types.Point(x=-1 * (diameter_13 / 2 - 0.2)))
            )
        if dry_run:
            p1k_1.return_tip()
        else:
            p1k_1.drop_tip()

    # add QC1
    p1k_1.pick_up_tip()
    p1k_1.mix(1, 25, qc1_start.bottom(z=2))
    for i in range(2):
        p1k_1.aspirate(25, qc1_start.bottom(z=1), rate=0.5)
        ctx.delay(seconds=1)
        p1k_1.dispense(25, qc1_end[i].bottom(z=5), rate=0.5)
        d = qc1_end[i].diameter
        diameter_14: float = d if d is not None else 6.86
        p1k_1.move_to(
            qc1_end[i].top(z=-2).move(types.Point(x=-1 * (diameter_14 / 2 - 0.2)))
        )
    if dry_run:
        p1k_1.return_tip()
    else:
        p1k_1.drop_tip()

    # add QC2
    p1k_1.pick_up_tip()
    p1k_1.mix(1, 25, qc2_start.bottom(z=2))
    for i in range(2):
        p1k_1.aspirate(25, qc2_start.bottom(z=1), rate=0.5)
        ctx.delay(seconds=1)
        p1k_1.dispense(25, qc2_end[i].bottom(z=5), rate=0.5)
        d = qc2_end[i].diameter
        diameter_15: float = d if d is not None else 6.86
        p1k_1.move_to(
            qc2_end[i].top(z=-2).move(types.Point(x=-1 * (diameter_15 / 2 - 0.2)))
        )
    if dry_run:
        p1k_1.return_tip()
    else:
        p1k_1.drop_tip()

    # add samples
    if num_sample > 0:
        for i, start in enumerate(sample_start):
            p1k_1.pick_up_tip()
            p1k_1.mix(1, 25, start.bottom(z=2))
            for j in range(2):
                p1k_1.aspirate(25, start.bottom(z=1), rate=0.5)
                ctx.delay(seconds=1)
                p1k_1.dispense(25, sample_end[i * 2 + j].bottom(z=5), rate=0.5)
                d = sample_end[i * 2 + j].diameter
                diameter_16: float = d if d is not None else 6.86
                p1k_1.move_to(
                    sample_end[i * 2 + j]
                    .top(z=-2)
                    .move(types.Point(x=-1 * (diameter_16 / 2 - 0.2)))
                )
            if dry_run:
                p1k_1.return_tip()
            else:
                p1k_1.drop_tip()

        hs.set_and_wait_for_shake_speed(rpm=1500)
        ctx.delay(seconds=10)
        hs.deactivate_shaker()

    # add beads

    p1k_1.tip_racks = [tips_1k]
    p1k_1.pick_up_tip()
    p1k_1.mix(10, 500, bead.bottom(z=2))
    p1k_1.aspirate(500, bead.meniscus(z=-1.5, target="end"))
    ctx.delay(seconds=2)
    for well in range(20):
        p1k_1.dispense(25, rxn_in_well[well].bottom(z=5), rate=0.5)
        ctx.delay(seconds=1)
        d = rxn_in_well[well].diameter
        diameter_17: float = d if d is not None else 6.86
        p1k_1.move_to(
            rxn_in_well[well].top(z=-2).move(types.Point(x=diameter_17 / 2 - 0.3))
        )
    if dry_run:
        p1k_1.return_tip()
    else:
        p1k_1.drop_tip()

    if num_sample > 0:

        n = num_sample * 2
        if n > 38:
            p1k_1.pick_up_tip()
            p1k_1.mix(10, 950, bead.bottom(z=2))
            p1k_1.aspirate(950, bead.meniscus(z=-1.5, target="end"))
            ctx.delay(seconds=2)
            for well in range(38):
                p1k_1.dispense(25, rxn_in_well[20 + well].bottom(z=5), rate=0.5)
                ctx.delay(seconds=1)
                d = rxn_in_well[20 + well].diameter
                diameter_18: float = d if d is not None else 6.86
                p1k_1.move_to(
                    rxn_in_well[20 + well]
                    .top(z=-2)
                    .move(types.Point(x=diameter_18 / 2 - 0.3))
                )
            if dry_run:
                p1k_1.return_tip()
            else:
                p1k_1.drop_tip()

            p1k_1.pick_up_tip()
            p1k_1.mix(10, (n - 38) * 25, bead.bottom(z=2))
            p1k_1.aspirate((n - 38) * 25, bead.meniscus(z=-1.5, target="end"))
            ctx.delay(seconds=2)
            for well in range(n - 38):
                p1k_1.dispense(25, rxn_in_well[20 + 38 + well].bottom(z=5), rate=0.5)
                ctx.delay(seconds=1)
                d = rxn_in_well[20 + 38 + well].diameter
                diameter_19: float = d if d is not None else 6.86
                p1k_1.move_to(
                    rxn_in_well[20 + 38 + well]
                    .top(z=-2)
                    .move(types.Point(x=diameter_19 / 2 - 0.3))
                )
            if dry_run:
                p1k_1.return_tip()
            else:
                p1k_1.drop_tip()
        else:
            p1k_1.pick_up_tip()
            p1k_1.mix(10, n * 25, bead.bottom(z=2))
            p1k_1.aspirate(n * 25, bead.meniscus(z=-1.5, target="end"))
            ctx.delay(seconds=2)
            for well in range(n):
                p1k_1.dispense(25, rxn_in_well[20 + well].bottom(z=5), rate=0.5)
                ctx.delay(seconds=1)
                d = rxn_in_well[20 + well].diameter
                diameter_20: float = d if d is not None else 6.86
                p1k_1.move_to(
                    rxn_in_well[20 + well]
                    .top(z=-2)
                    .move(types.Point(x=diameter_20 / 2 - 0.3))
                )
            if dry_run:
                p1k_1.return_tip()
            else:
                p1k_1.drop_tip()

    hs.set_and_wait_for_shake_speed(rpm=1500)
    ctx.delay(seconds=10)
    hs.deactivate_shaker()

    hs.open_labware_latch()
    ctx.pause(
        "Seal Assay Plate and incubate with agitation for 16-18 hours at 2-8 degrees C"
    )
