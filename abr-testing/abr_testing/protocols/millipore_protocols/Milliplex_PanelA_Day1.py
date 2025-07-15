"""Human Cytokine Panel A Milliplex Protocol Day 1."""
from opentrons import types
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.protocol_api.module_contexts import HeaterShakerContext

metadata = {
    "protocolName": "Human Cytokine Panel A Milliplex Protocol Day 1",
    "author": "Science Team, Opentrons",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
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
    parameters.add_str(
        variable_name="matrix_type",
        display_name="Sample Matrix Type",
        description="Type of samples to be processed",
        default="Serum Matrix",
        choices=[
            {"display_name": "Serum/Plasma", "value": "Serum Matrix"},
            {"display_name": "Cell Culture Supernatant", "value": "Culture Medium"},
            {"display_name": "High Dilution Samples", "value": "Assay Buffer"},
        ],
    )


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    dry_run = ctx.params.dry_run  # type: ignore[attr-defined]
    num_sample = ctx.params.num_sample  # type: ignore[attr-defined]
    pipet_location = ctx.params.pipet_location  # type: ignore[attr-defined]
    matrix_type = ctx.params.matrix_type  # type: ignore[attr-defined]

    if num_sample > 0:

        if num_sample < 7:
            num_col_reagent_plate = 2

        else:
            num_col_reagent_plate = int((num_sample - 6) // 8) + 2
            if (num_sample - 6) % 8 != 0:
                num_col_reagent_plate = num_col_reagent_plate + 1

    else:
        num_col_reagent_plate = 2

    num_rxn = 20 + (num_sample * 2)
    # total wells in assay plate

    num_col = num_col_reagent_plate * 2
    # total columns in assay plate

    if pipet_location == 1:
        p1k_1_loc = "right"
        p1k_8_loc = "left"
    else:
        p1k_1_loc = "left"
        p1k_8_loc = "right"

    vol_assay_well = 200
    vol_std_transfer = 50
    MPX_kit = "HCYTA-60K"

    ctx.comment(f"Selected Matrix Type: {matrix_type}")

    # deck layout

    hs: HeaterShakerContext = ctx.load_module(
        "heaterShakerModuleV1", "D3"
    )  # type: ignore[assignment]
    hs_adapter = hs.load_adapter("opentrons_universal_flat_adapter_type_b")
    assay_plate = hs_adapter.load_labware(
        "greiner_96_wellplate_392ul_chimney", "ASSAY PLATE"
    )
    rxn_end = assay_plate.rows()[0][:num_col]
    rxn_end_in_well = assay_plate.wells()[: num_col * 8]

    reagent_plate = ctx.load_labware(
        "axygen_96_wellplate_500ul", "D2", "REAGENT PLATE"
    )  # changed to axygen plate for better visualization
    rxn_start = reagent_plate.rows()[0][
        :num_col_reagent_plate
    ]  # changed to first column
    std_prep = reagent_plate.wells()[0:8]  # changed from 8:16
    bead = reagent_plate.rows()[0][6]
    bead_well = reagent_plate.wells()[48:56]

    buffer_res = ctx.load_labware("nest_12_reservoir_15ml", "C2", "ASSAY BUFFER")
    assay_buffer = buffer_res.wells()[0]

    buffer_rack = ctx.load_labware(
        "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical",
        "B1",
        "BEAD SLURRY and SAMPLE MATRIX",
    )
    bead_stock = buffer_rack.wells()[0]
    sm = buffer_rack.wells()[1]  # changed to tube rack

    ctx.load_trash_bin("A3")

    tips_1k = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "C3", "1000uL TIPS")
    tips_200 = [
        ctx.load_labware("opentrons_flex_96_tiprack_200ul", slot, "200uL TIPS")
        for slot in ["B2", "B3"]
    ]

    p1k_1 = ctx.load_instrument("flex_1channel_1000", p1k_1_loc)
    p1k_8 = ctx.load_instrument("flex_8channel_1000", p1k_8_loc)

    # liquid info

    ctx.comment(
        f"""Vol of Assay Buffer in Std Curve: {vol_assay_well}; Vol of STD Transfer: {vol_std_transfer};
        MILLIPLEX(R) Kit Being Used: {MPX_kit}"""
    )

    if num_sample > 0:
        vol_sample = 25 * 2 + 50
        def_sample = ctx.define_liquid(
            name="Samples", description=" ", display_color="#50C878"
        )  # Green
        for well in range(num_sample):
            reagent_plate.wells()[10 + well].load_liquid(
                liquid=def_sample, volume=vol_sample
            )  # changed from 18

    vol_qc = 25 * 2 + 50
    def_qc1 = ctx.define_liquid(
        name="QC1", description=" ", display_color="#FF0000"
    )  # Red
    def_qc2 = ctx.define_liquid(
        name="QC2", description=" ", display_color="#FF0000"
    )  # Red
    reagent_plate.wells()[8].load_liquid(
        liquid=def_qc1, volume=vol_qc
    )  # changed from 16
    reagent_plate.wells()[9].load_liquid(
        liquid=def_qc2, volume=vol_qc
    )  # chnaged from 17

    vol_sm = 25 * 20 + 100
    def_sm = ctx.define_liquid(
        name=matrix_type, description=matrix_type, display_color="#D2B48C"
    )  # Tan
    buffer_rack.wells()[1].load_liquid(liquid=def_sm, volume=vol_sm)

    vol_std = 250  # just made the standard what comes with the assay
    def_std = ctx.define_liquid(
        name="Standard 7", description=" ", display_color="#0000FF"
    )  # Blue
    reagent_plate.wells()[7].load_liquid(
        liquid=def_std, volume=vol_std
    )  # chnaged from 15 to 7

    vol_assay = (num_col - 3 - 1) * 25 * 8 + 2000 + 1500
    def_assay = ctx.define_liquid(
        name="Assay Buffer", description=" ", display_color="#ADD8E6"
    )  # Light blue
    buffer_res.wells()[0].load_liquid(liquid=def_assay, volume=vol_assay)

    vol_bead = (
        25 * num_rxn + num_rxn * 0.2 + 300
    )  # needed more volume, didn't account for std and QC wells | kits come with 3.2 mL total
    def_bead = ctx.define_liquid(
        name="Premixed Beads", description=" ", display_color="#FF5349"
    )  # Red-Orange
    buffer_rack.wells()[0].load_liquid(liquid=def_bead, volume=vol_bead)

    # protocol

    # prepare working standards

    # add assay buffer
    hs.close_labware_latch()

    p1k_1.tip_racks = [tips_1k]
    p1k_1.pick_up_tip()

    vol = vol_assay_well / 2

    for _ in range(2):
        p1k_1.aspirate(
            vol * 7 + 50, assay_buffer.bottom(z=1), rate=0.75
        )  # change +10 to +50
        ctx.delay(seconds=0.25)
        p1k_1.dispense(vol * 7 - 50, assay_buffer.bottom(z=1), rate=0.75)
        p1k_1.aspirate(vol * 7 - 50, assay_buffer.bottom(z=1), rate=0.75)
        ctx.delay(seconds=0.25)
        p1k_1.default_speed /= 16
        p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.5, z=-2)))
        ctx.delay(seconds=0.5)
        p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.5, z=4)))
        p1k_1.default_speed *= 16
        for i in range(7):
            p1k_1.dispense(
                vol, std_prep[i].bottom(z=1), rate=0.25
            )  # chnaged to dispense lower
            ctx.delay(seconds=1)
    if dry_run:
        p1k_1.return_tip()
    else:
        p1k_1.drop_tip()

    # make serial dilutions
    p1k_1.tip_racks = tips_200
    for i in reversed(range(6)):
        p1k_1.pick_up_tip()
        p1k_1.aspirate(vol_std_transfer, std_prep[i + 2].bottom(z=1), rate=0.25)
        ctx.delay(seconds=1)
        p1k_1.dispense(
            vol_std_transfer - 1, std_prep[i + 1].bottom(z=1.5), rate=0.5
        )  # removed , push_out=10
        ctx.delay(seconds=1)
        for _ in range(10):
            p1k_1.aspirate(
                100, std_prep[i + 1].bottom(z=1.5), rate=0.75
            )  # aspirated extra bc of bubble
            p1k_1.dispense(
                99.9, std_prep[i + 1].bottom(z=1.5), rate=0.75
            )  # aspirated extra bc of bubble
        p1k_1.dispense(
            p1k_1.current_volume, std_prep[i + 1].bottom(z=3), rate=0.5
        )  # aspirated extra bc of bubble
        if dry_run:
            p1k_1.return_tip()
        else:
            p1k_1.drop_tip()

    # add serum matrix and assay buffer

    # add serum matrix
    p1k_1.tip_racks = [tips_1k]
    p1k_1.pick_up_tip()
    p1k_1.aspirate(550, sm.bottom(z=1), rate=0.1)
    p1k_1.default_speed /= 10
    p1k_1.move_to(sm.top(z=-5))
    ctx.delay(seconds=1)
    d = sm.diameter
    d_1: float = d if d is not None else 15.5
    p1k_1.move_to(sm.top(z=-5).move(types.Point(x=d_1 / 2 - 0.1)))
    ctx.delay(seconds=1)
    p1k_1.default_speed *= 10
    for well in range(16):
        p1k_1.dispense(25, rxn_end_in_well[well].bottom(z=0.8), rate=0.1)
        ctx.delay(seconds=1)
    for well in [16, 17, 24, 25]:
        p1k_1.dispense(25, rxn_end_in_well[well].bottom(z=0.8), rate=0.1)
        ctx.delay(seconds=1)
    if dry_run:
        p1k_1.return_tip()
    else:
        p1k_1.drop_tip()

    # add assay buffer
    p1k_1.tip_racks = tips_200
    p1k_8.tip_racks = tips_200

    if num_sample > 0:

        if num_sample < 7:
            p1k_1.pick_up_tip()
            for n in range(2):
                p1k_1.aspirate(
                    25 * num_sample + 25, assay_buffer.bottom(z=2), rate=0.2
                )  # add extra 25
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 16
                p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.5, z=-2)))
                ctx.delay(seconds=0.5)
                p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.5, z=4)))
                p1k_1.default_speed *= 16
                for i in range(num_sample):
                    p1k_1.dispense(
                        25, rxn_end_in_well[8 * n + 18 + i].bottom(z=0.8), rate=0.2
                    )
                    ctx.delay(seconds=1)
            if dry_run:
                p1k_1.return_tip()
            else:
                p1k_1.drop_tip()

        else:
            p1k_1.pick_up_tip()
            for n in range(2):
                p1k_1.aspirate(
                    25 * 6 + 25, assay_buffer.bottom(z=2), rate=0.25
                )  # add extra 25
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 16
                p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.5, z=-2)))
                ctx.delay(seconds=0.5)
                p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.5, z=4)))
                p1k_1.default_speed *= 16
                for i in range(6):
                    p1k_1.dispense(
                        25, rxn_end_in_well[8 * n + 18 + i].bottom(z=0.8), rate=0.25
                    )
                    ctx.delay(seconds=1)
            if dry_run:
                p1k_1.return_tip()
            else:
                p1k_1.drop_tip()

            p1k_8.pick_up_tip()
            p1k_8.aspirate(25 * (num_col - 4), assay_buffer.bottom(z=2), rate=0.1)
            p1k_8.default_speed /= 16
            p1k_8.move_to(assay_buffer.top().move(types.Point(x=-3.5, z=-2)))
            ctx.delay(seconds=0.5)
            p1k_8.move_to(assay_buffer.top().move(types.Point(x=-3.5, z=4)))
            p1k_8.default_speed *= 16
            ctx.delay(seconds=1)
            for i in range(num_col - 4):
                p1k_8.dispense(25, rxn_end[4 + i].bottom(z=0.8), rate=0.1)
                ctx.delay(seconds=1)
            if dry_run:
                p1k_8.return_tip()
            else:
                p1k_8.drop_tip()

    hs.set_and_wait_for_shake_speed(rpm=700)
    ctx.delay(minutes=0.1 if dry_run else 0.1)
    hs.deactivate_shaker()

    # transfer standards, QC and samples from reagent plate

    for col in range(num_col_reagent_plate):
        p1k_8.tip_racks = tips_200
        p1k_8.pick_up_tip()
        p1k_8.aspirate(
            25 * 2 + 15, rxn_start[col].bottom(z=1), rate=0.25
        )  # slowed down
        p1k_8.dispense(25 * 2, rxn_start[col].bottom(z=1), rate=0.25)
        p1k_8.aspirate(25 * 2, rxn_start[col].bottom(z=1), rate=0.25)
        ctx.delay(seconds=1)
        for n in range(2):
            p1k_8.dispense(25, rxn_end[col * 2 + n].bottom(z=1), rate=0.25)
            ctx.delay(seconds=1)
        if dry_run:
            p1k_8.return_tip()
        else:
            p1k_8.drop_tip()

    hs.set_and_wait_for_shake_speed(rpm=700)
    ctx.delay(minutes=0.1 if dry_run else 0.1)
    hs.deactivate_shaker()

    # add beads

    count = num_sample + 10
    count_full = int(count // 8)

    col_full = int(count // 8) * 2
    well_last = count % 8

    vol_dist = 25 * col_full + 25
    num_well = 8

    # fill full columns
    if col_full > 0:
        p1k_1.tip_racks = [tips_1k]
        p1k_1.pick_up_tip()

        p1k_1.aspirate(vol_dist + 10, bead_stock.bottom(z=2), rate=0.5)
        p1k_1.dispense(vol_dist, bead_stock.bottom(z=2), rate=0.5)
        p1k_1.aspirate(vol_dist, bead_stock.bottom(z=2), rate=0.5)
        p1k_1.dispense(vol_dist, bead_stock.bottom(z=2), rate=0.5)
        p1k_1.aspirate(vol_dist, bead_stock.bottom(z=2), rate=0.5)
        p1k_1.dispense(vol_dist, bead_stock.bottom(z=2), rate=0.5)

        for i in range(num_well):
            p1k_1.aspirate(vol_dist, bead_stock.bottom(z=2), rate=0.5)
            p1k_1.dispense(vol_dist, bead_stock.bottom(z=2), rate=0.5)
            ctx.delay(seconds=1)

            end = bead_well[i]
            p1k_1.aspirate(vol_dist, bead_stock.bottom(z=2), rate=0.5)
            ctx.delay(seconds=1)
            p1k_1.dispense(vol_dist, end.bottom(z=2), rate=0.5)
            ctx.delay(seconds=1)
            p1k_1.default_speed /= 20
            p1k_1.move_to(end.top(z=-2))
            p1k_1.default_speed *= 20

        if dry_run:
            p1k_1.return_tip()
        else:
            p1k_1.drop_tip()

        p1k_8.tip_racks = tips_200

        for i in range(count_full):

            p1k_8.pick_up_tip()

            p1k_8.aspirate(
                25 * 2 + 5, bead.bottom(z=2), rate=0.5
            )  # aspirated extra bc of bubble
            p1k_8.dispense(25 * 2, bead.bottom(z=2), rate=0.5)
            p1k_8.aspirate(25 * 2, bead.bottom(z=2), rate=0.5)
            p1k_8.dispense(25 * 2, bead.bottom(z=2), rate=0.5)
            p1k_8.aspirate(25 * 2, bead.bottom(z=2), rate=0.5)
            ctx.delay(seconds=1)

            end_1 = rxn_end[i * 2]
            end_2 = rxn_end[i * 2 + 1]

            p1k_8.dispense(25, end_1.bottom(z=2.1), rate=0.5)
            ctx.delay(seconds=1)

            p1k_8.default_speed /= 20
            d = end_1.diameter
            d_3: float = d if d is not None else 6.96
            p1k_8.move_to(end_1.top(z=-3).move(types.Point(y=d_3 / 2 + 0.15)))
            p1k_8.move_to(end_1.top(z=3))
            p1k_8.default_speed *= 20

            p1k_8.dispense(25, end_2.bottom(z=2.1), rate=0.5)
            ctx.delay(seconds=1)

            p1k_8.default_speed /= 20
            d = end_2.diameter
            d_4: float = d if d is not None else 6.96
            p1k_8.move_to(end_2.top(z=-3).move(types.Point(y=d_4 / 2 + 0.15)))
            p1k_8.move_to(end_2.top(z=3))
            p1k_8.default_speed *= 20

            if dry_run:
                p1k_8.return_tip()
            else:
                p1k_8.drop_tip()

    # fill partial columns
    if well_last > 0:
        p1k_1.tip_racks = tips_200

        for well in range(well_last):

            p1k_1.pick_up_tip()

            vol_last = 25 * 2

            p1k_1.aspirate(vol_last + 10, bead_stock.bottom(z=2), rate=0.5)
            p1k_1.dispense(vol_last, bead_stock.bottom(z=2), rate=0.5)
            p1k_1.aspirate(vol_last, bead_stock.bottom(z=2), rate=0.5)
            p1k_1.dispense(vol_last, bead_stock.bottom(z=2), rate=0.5)
            p1k_1.aspirate(vol_last, bead_stock.bottom(z=2), rate=0.5)
            ctx.delay(seconds=1)

            for x in [0, 8]:

                end = rxn_end_in_well[col_full * 8 + well + x]

                p1k_1.dispense(25, end.bottom(z=2.1), rate=0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                d = end.diameter
                d_2 = d if d is not None else 6.96
                p1k_1.move_to(end.top(z=-3).move(types.Point(y=d_2 / 2 + 0.15)))
                p1k_1.move_to(end.top(z=3))
                p1k_1.default_speed *= 20

            if dry_run:
                p1k_1.return_tip()
            else:
                p1k_1.drop_tip()

    hs.set_and_wait_for_shake_speed(rpm=1500)
    ctx.delay(minutes=0.1 if dry_run else 0.25)
    hs.deactivate_shaker()
    hs.open_labware_latch()
    ctx.pause(
        "Seal Assay Plate and incubate with agitation for 16-18 hours at 2-8 degrees C"
    )
