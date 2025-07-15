"""Human Cytokine Panel A Milliplex Protocol Day 2."""
from opentrons import types
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.protocol_api.module_contexts import HeaterShakerContext

metadata = {
    "protocolName": "Human Cytokine Panel A Milliplex Protocol Day 2",
    "author": "Science Team, Opentrons",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}

SPEED_SHAKE = 700


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        description=("All incubation steps skipped and tips returned to tipracks"),
        default=False,
    )
    parameters.add_int(
        variable_name="plate_covering",
        display_name="Plate Covering",
        description=("Lid or seal the assay plate manually during incubation?"),
        default=1,
        choices=[
            {"display_name": "with plate lid", "value": 1},
            {"display_name": "with plate seal (manually)", "value": 2},
            {"display_name": "N/A", "value": 3},
        ],
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
    """Protocol."""
    dry_run = ctx.params.dry_run  # type: ignore[attr-defined]
    plate_covering = ctx.params.plate_covering  # type: ignore[attr-defined]
    num_sample = ctx.params.num_sample  # type: ignore[attr-defined]
    pipet_location = ctx.params.pipet_location  # type: ignore[attr-defined]

    num_col_full = int((10 + num_sample) // 8) * 2
    num_well_in_last_col = (10 + num_sample) % 8

    MPX_kit = "HYCTA-60k"

    if num_sample > 0:

        if num_sample < 7:
            num_col_reagent_plate = 2

        else:
            num_col_reagent_plate = int((num_sample - 6) // 8) + 2
            if (num_sample - 6) % 8 != 0:
                num_col_reagent_plate = num_col_reagent_plate + 1

    else:
        num_col_reagent_plate = 2

    # total wells in assay plate

    num_col = num_col_reagent_plate * 2
    # total columns in assay plate

    if pipet_location == 1:
        p1k_1_loc = "right"
        p1k_8_loc = "left"
    else:
        p1k_1_loc = "left"
        p1k_8_loc = "right"

    # Debugging output
    ctx.comment(f"Selected MILLIPLEX(R) Kit: {MPX_kit}")

    # Define volumes based on selected kit using a dictionary
    kit_volumes_times = {
        "HYCTA-60k": (25, 60, 30, 150),
        "HMH3-34K": (50, 60, 30, 150),
        "HCCBP1MAG-58K": (25, 60, 30, 100),
        "PRCYTA-40K": (25, 60, 30, 100),
        "RPTMAG-86K": (50, 30, 30, 100),
        "RKTX1MAG-37K": (50, 60, 30, 125),
        "RKTX2MAG-37K": (50, 60, 30, 125),
        "PCYTMAG-23K": (25, 60, 30, 100),
    }

    # Assign volumes based on the selected kit
    if MPX_kit in kit_volumes_times:
        (
            vol_DET_SAPE,
            detection_incubation,
            SAPE_incubation,
            sheath_well,
        ) = kit_volumes_times[MPX_kit]
    else:
        vol_DET_SAPE = 0  # Default value if condition is not met
        detection_incubation = 0  # Default value if condition is not met
        SAPE_incubation = 0  # Default value if condition is not met
        sheath_well = 0  # Default value if condition is not met
        ctx.comment(
            "Warning: No assay associated with the chosen kit, defaulting volumes to 0."
        )

    # Volume info
    ctx.comment(
        f"""Volume of Detection/SAPE: {vol_DET_SAPE}; Detection Incubation Time: {detection_incubation};
        SAPE Incubation Time: {SAPE_incubation}; MILLIPLEX(R) Kit Being Used: {MPX_kit}"""
    )

    # deck layout
    hs: HeaterShakerContext = ctx.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    hs_adapter = hs.load_adapter("opentrons_universal_flat_adapter_type_b")
    assay_plate = hs_adapter.load_labware(
        "greiner_96_wellplate_392ul_chimney", "ASSAY PLATE"
    )
    # working_plate_lid = ctx.load_labware('corning_96_wellplate_360ul_flat', 'C4')
    rxn_in_full_col = assay_plate.rows()[0][:num_col_full]
    if num_well_in_last_col > 0:
        rxn_in_last_col_1 = assay_plate.wells()[
            (num_col_full * 8) : (num_col_full * 8 + num_well_in_last_col)
        ]
        rxn_in_last_col_2 = assay_plate.wells()[
            (num_col_full * 8 + 8) : (num_col_full * 8 + 8 + num_well_in_last_col)
        ]

    buffer_res = ctx.load_labware("nest_12_reservoir_15ml", "C2", "SHEATH FLUID")
    sf = buffer_res.wells()[4:6]

    buffer_rack = ctx.load_labware(
        "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical", "B1", "ANTIBODIES, SAPE"
    )
    ab_stock = buffer_rack.wells()[1]
    sape_stock = buffer_rack.wells()[2]

    temp_plate = ctx.load_labware("axygen_96_wellplate_500ul", "D2", "WORKING PLATE")
    ab = temp_plate.rows()[0][0]
    sape = temp_plate.rows()[0][1]
    ab_in_well = temp_plate.wells()[0:8]
    sape_in_well = temp_plate.wells()[8:16]

    ctx.load_trash_bin("A3")

    tips_1k = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "C3", "1000uL TIPS")
    tips_200 = [
        ctx.load_labware("opentrons_flex_96_tiprack_200ul", slot, "200uL TIPS")
        for slot in ["B2", "B3"]
    ]

    p1k_1 = ctx.load_instrument("flex_1channel_1000", p1k_1_loc)
    p1k_8 = ctx.load_instrument("flex_8channel_1000", p1k_8_loc)

    # volume info
    vol_info = (
        (vol_DET_SAPE * (num_col_full + 2) + 50) * num_well_in_last_col
        + (vol_DET_SAPE * num_col_full + 50) * (8 - num_well_in_last_col)
        + 200
    )  # added volume
    def_ab = ctx.define_liquid(
        name="Detection Antibodies", description=" ", display_color="#330000"
    )  # Dark
    def_sape = ctx.define_liquid(
        name="Streptavidin-Phycoerythrin (SAPE)",
        description=" ",
        display_color="#FF007F",
    )  # Pink
    buffer_rack.wells()[1].load_liquid(liquid=def_ab, volume=vol_info)
    buffer_rack.wells()[2].load_liquid(liquid=def_sape, volume=vol_info)

    if num_well_in_last_col > 0:
        num_col = num_col_full + 2
    else:
        num_col = num_col_full

    if num_col > 6:
        vol_sf_1 = 8000
        vol_sf_2 = (num_col - 7) * 150 * 8 + 1500
        def_sf_1 = ctx.define_liquid(
            name="Sheath Fluid", description=" ", display_color="#9966FF"
        )  # light
        def_sf_2 = ctx.define_liquid(
            name="Sheath Fluid", description=" ", display_color="#9966FF"
        )  # light
        buffer_res.wells()[4].load_liquid(liquid=def_sf_1, volume=vol_sf_1)
        buffer_res.wells()[5].load_liquid(liquid=def_sf_2, volume=vol_sf_2)
    else:
        vol_sf_1 = (num_col - 1) * 150 * 8 + 1500
        def_sf_1 = ctx.define_liquid(
            name="Sheath Fluid", description=" ", display_color="#9966FF"
        )  # light
        buffer_res.wells()[4].load_liquid(liquid=def_sf_1, volume=vol_sf_1)

    if plate_covering == 1:

        ctx.load_lid_stack("greiner_96_wellplate_392ul_chimney_lid", "C4", 1)

        def cover() -> None:
            """Cover lid."""
            ctx.move_lid(
                "C4",
                assay_plate,
                use_gripper=True,
            )

        def uncover() -> None:
            """Uncover lid."""
            ctx.move_lid(
                assay_plate,
                "C4",
                use_gripper=True,
            )

    # protocol
    hs.close_labware_latch()
    # add detection ab and shake, and then SAPE

    stock = [ab_stock, sape_stock]
    in_well = [ab_in_well, sape_in_well]
    reagent = [ab, sape]
    if dry_run:
        incubation_time = [0.1, 0.1]
    else:
        incubation_time = [detection_incubation, SAPE_incubation]
    touch_tip = [1, -1]

    for loc_1, loc_2, loc_3, min, touch in zip(
        stock, in_well, reagent, incubation_time, touch_tip
    ):
        p1k_1.tip_racks = [tips_1k]

        p1k_1.pick_up_tip()
        if num_well_in_last_col > 0:
            for i in range(num_well_in_last_col):
                vol = (
                    vol_DET_SAPE * (num_col_full + 2) + 50
                )  # needed more volume, added 50 instead of 20
                p1k_1.aspirate(vol, loc_1.bottom(z=2), rate=0.25)
                ctx.delay(seconds=1)
                p1k_1.dispense(vol, loc_2[i].bottom(z=2), rate=0.25, push_out=10)
                ctx.delay(seconds=1)
                d = loc_2[i].diameter
                diameter: float = d if d is not None else 6.96
                p1k_1.move_to(
                    loc_2[i].top(z=-1.5).move(types.Point(x=diameter / 2.0 + 0.1))
                )
        for i in range(8 - num_well_in_last_col):
            vol = (
                vol_DET_SAPE * num_col_full + 50
            )  # needed more volume, added 50 instead of 20
            p1k_1.aspirate(vol, loc_1.bottom(z=2), rate=0.25)
            ctx.delay(seconds=1)
            p1k_1.dispense(
                vol, loc_2[num_well_in_last_col + i].bottom(z=2), rate=0.25, push_out=10
            )
            ctx.delay(seconds=1)
            p1k_1.default_speed /= 25
            p1k_1.move_to(loc_2[num_well_in_last_col + i].top(z=-1))
            p1k_1.default_speed *= 25
        if dry_run:
            p1k_1.return_tip()
        else:
            p1k_1.drop_tip()

        p1k_8.tip_racks = [tips_1k]
        p1k_8.pick_up_tip()

        if num_col_full > 6:
            p1k_8.aspirate(vol_DET_SAPE * 6 + 15, loc_3.bottom(z=1), rate=0.25)
            p1k_8.dispense(vol_DET_SAPE * 6, loc_3.bottom(z=1), rate=0.25)
            p1k_8.aspirate(vol_DET_SAPE * 6, loc_3.bottom(z=1), rate=0.25)
            ctx.delay(seconds=1)
            p1k_8.default_speed /= 20
            p1k_8.move_to(loc_3.top(z=-1))
            p1k_8.default_speed *= 20
            ctx.delay(seconds=1)
            for i in range(6):
                p1k_8.dispense(vol_DET_SAPE, rxn_in_full_col[i].bottom(z=2), rate=0.5)
                ctx.delay(seconds=1)
                p1k_8.default_speed /= 25
                d = rxn_in_full_col[i].diameter
                diameter_2: float = d if d is not None else 6.96
                p1k_8.move_to(
                    rxn_in_full_col[i]
                    .top(z=-1)
                    .move(types.Point(x=touch * (diameter_2 / 2 + touch * 0.05)))
                )
                p1k_8.default_speed *= 25

            p1k_8.aspirate(
                vol_DET_SAPE * (num_col_full - 6), loc_3.bottom(z=1), rate=0.25
            )
            p1k_8.dispense(
                vol_DET_SAPE * (num_col_full - 6) - 5, loc_3.bottom(z=1), rate=0.25
            )
            p1k_8.aspirate(
                vol_DET_SAPE * (num_col_full - 6) - 5, loc_3.bottom(z=1), rate=0.25
            )
            ctx.delay(seconds=1)
            for j in range(num_col_full - 6):
                p1k_8.dispense(
                    vol_DET_SAPE, rxn_in_full_col[6 + j].bottom(z=2), rate=0.5
                )
                ctx.delay(seconds=1)
                p1k_8.default_speed /= 25
                d = rxn_in_full_col[6 + j].diameter
                diameter_3: float = d if d is not None else 6.96
                p1k_8.move_to(
                    rxn_in_full_col[6 + j]
                    .top(z=-1)
                    .move(types.Point(x=touch * (diameter_3 / 2 + touch * 0.05)))
                )
                p1k_8.default_speed *= 25

        else:
            # ctx.comment("After dispensing full column")
            p1k_8.aspirate(
                vol_DET_SAPE * num_col_full + 15, loc_3.bottom(z=1), rate=0.25
            )
            p1k_8.dispense(vol_DET_SAPE * num_col_full, loc_3.bottom(z=1), rate=0.25)
            p1k_8.aspirate(vol_DET_SAPE * num_col_full, loc_3.bottom(z=1), rate=0.25)
            ctx.delay(seconds=1)
            p1k_8.default_speed /= 20
            p1k_8.move_to(loc_3.top(z=-1))  # fix
            p1k_8.default_speed *= 20
            for i in range(num_col_full):
                p1k_8.dispense(vol_DET_SAPE, rxn_in_full_col[i].bottom(z=2), rate=0.5)
                ctx.delay(seconds=1)
                p1k_8.default_speed /= 25
                d = rxn_in_full_col[i].diameter
                diameter_4: float = d if d is not None else 6.96
                p1k_8.move_to(
                    rxn_in_full_col[i]
                    .top(z=-1)
                    .move(types.Point(x=touch * (diameter_4 / 2 + touch * 0.05)))
                )
                p1k_8.default_speed *= 25

        if dry_run:
            p1k_8.return_tip()
        else:
            p1k_8.drop_tip()

        if num_well_in_last_col > 0:
            p1k_1.tip_racks = tips_200
            p1k_1.pick_up_tip()

            for n in range(num_well_in_last_col):
                p1k_1.aspirate(vol_DET_SAPE + 10, loc_2[n].bottom(z=1), rate=0.2)
                p1k_1.dispense(vol_DET_SAPE, loc_2[n].bottom(z=1), rate=0.2)
                p1k_1.aspirate(vol_DET_SAPE, loc_2[n].bottom(z=1), rate=0.2)
                ctx.delay(seconds=1)
            for n in range(num_well_in_last_col):
                p1k_1.dispense(vol_DET_SAPE, rxn_in_last_col_1[n].bottom(z=2), rate=0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 25
                d = rxn_in_last_col_1[n].diameter
                diameter_5: float = d if d is not None else 6.96
                p1k_1.move_to(
                    rxn_in_last_col_1[n]
                    .top(z=-1)
                    .move(types.Point(x=touch * (diameter_5 / 2 + touch * 0.05)))
                )
                p1k_1.default_speed *= 25

            for n in range(num_well_in_last_col):
                p1k_1.aspirate(vol_DET_SAPE, loc_2[n].bottom(z=1), rate=0.2)
                p1k_1.dispense(vol_DET_SAPE, loc_2[n].bottom(z=1), rate=0.2)
                p1k_1.aspirate(vol_DET_SAPE, loc_2[n].bottom(z=1), rate=0.2)
                ctx.delay(seconds=1)
            for n in range(num_well_in_last_col):
                p1k_1.dispense(vol_DET_SAPE, rxn_in_last_col_2[n].bottom(z=2), rate=0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 25
                d = rxn_in_last_col_2[n].diameter
                diameter_6: float = d if d is not None else 6.96
                p1k_1.move_to(
                    rxn_in_last_col_2[n]
                    .top(z=-1)
                    .move(types.Point(x=touch * (diameter_6 / 2 + touch * 0.05)))
                )
                p1k_1.default_speed *= 25

            if dry_run:
                p1k_1.return_tip()
            else:
                p1k_1.drop_tip()

        if plate_covering == 1:
            cover()

        elif plate_covering == 2:
            hs.open_labware_latch()
            ctx.pause("Seal Assay Plate")
            hs.close_labware_latch()

        hs.set_and_wait_for_shake_speed(rpm=SPEED_SHAKE)
        ctx.delay(minutes=min)
        hs.deactivate_shaker()

        if plate_covering == 1:
            uncover()

        elif plate_covering == 2:
            hs.open_labware_latch()
            ctx.pause("Remove plate seal")
            hs.close_labware_latch()

    hs.open_labware_latch()
    ctx.pause("Wash Assay Plate off deck and then load Assay Plate on Shaker")
    hs.close_labware_latch()

    # add sheath fluid and shake
    p1k_8.tip_racks = [tips_1k]
    p1k_8.pick_up_tip()

    if num_col_full > 6:
        p1k_8.aspirate(sheath_well * 6 + 15, sf[0].bottom(z=2), rate=0.1)  # slowed down
        ctx.delay(seconds=2)
        for i in range(6):
            p1k_8.dispense(sheath_well, rxn_in_full_col[i].top(z=-2), rate=0.1)
            ctx.delay(seconds=1)
            p1k_1.default_speed /= 20
            d = rxn_in_full_col[i].diameter
            diameter_7: float = d if d is not None else 6.96
            p1k_8.move_to(
                rxn_in_full_col[i]
                .top(z=-2)
                .move(types.Point(x=touch * (diameter_7 / 2 + 0.05)))
            )
            p1k_1.default_speed *= 20

        p1k_8.aspirate(
            sheath_well * (num_col_full - 6), sf[1].bottom(z=2), rate=0.1
        )  # slowed down, changed to just liquid in 11
        ctx.delay(seconds=2)
        for j in range(num_col_full - 6):
            p1k_8.dispense(sheath_well, rxn_in_full_col[6 + j].top(z=-2), rate=0.1)
            ctx.delay(seconds=1)
            p1k_1.default_speed /= 20
            d = rxn_in_full_col[6 + j].diameter
            diameter_8: float = d if d is not None else 6.96
            p1k_8.move_to(
                rxn_in_full_col[6 + j]
                .top(z=-2)
                .move(types.Point(x=touch * (diameter_8 / 2 + 0.05)))
            )
            p1k_1.default_speed *= 20

    else:

        p1k_8.aspirate(
            sheath_well * num_col_full, sf[0].bottom(z=2), rate=0.1
        )  # slowed down
        ctx.delay(seconds=2)
        for col in range(num_col_full):
            p1k_8.dispense(sheath_well, rxn_in_full_col[col].top(z=-2), rate=0.25)
            ctx.delay(seconds=1)
            p1k_1.default_speed /= 20
            d = rxn_in_full_col[col].diameter
            diameter_9: float = d if d is not None else 6.96
            p1k_8.move_to(
                rxn_in_full_col[col]
                .top(z=-2)
                .move(types.Point(x=touch * (diameter_9 / 2 + 0.05)))
            )
            p1k_1.default_speed *= 20

    if dry_run:
        p1k_8.return_tip()
    else:
        p1k_8.drop_tip()

    if num_well_in_last_col > 0:
        p1k_1.tip_racks = [tips_1k]
        p1k_1.pick_up_tip()

        if num_col_full + 2 > 6:
            sf_loc = sf[1]
        else:
            sf_loc = sf[0]

        if num_well_in_last_col > 4:
            p1k_1.aspirate(
                sheath_well * 4, sf_loc.bottom(z=2), rate=0.25
            )  # slowed down
            ctx.delay(seconds=2)
            for well in range(4):
                p1k_1.dispense(sheath_well, rxn_in_last_col_1[well].top(z=-2), rate=0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                d = rxn_in_last_col_1[well].diameter
                diameter_10: float = d if d is not None else 6.96
                p1k_1.move_to(
                    rxn_in_last_col_1[well]
                    .top(z=-2)
                    .move(types.Point(x=touch * (diameter_10 / 2 + 0.05)))
                )
                p1k_1.default_speed *= 20
            p1k_1.aspirate(
                sheath_well * 4, sf_loc.bottom(z=1), rate=0.25
            )  # slowed down
            ctx.delay(seconds=2)
            for well in range(4):
                p1k_1.dispense(sheath_well, rxn_in_last_col_2[well].top(z=-2), rate=0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                d = rxn_in_last_col_2[well].diameter
                diameter_11: float = d if d is not None else 6.96
                p1k_1.move_to(
                    rxn_in_last_col_2[well]
                    .top(z=-2)
                    .move(types.Point(x=touch * (diameter_11 / 2 + 0.05)))
                )
                p1k_1.default_speed *= 20

            p1k_1.aspirate(
                sheath_well * (num_well_in_last_col - 4), sf_loc.bottom(z=2), rate=0.25
            )  # slowed down
            ctx.delay(seconds=2)
            for well_int in range(num_well_in_last_col - 4):
                p1k_1.dispense(
                    sheath_well, rxn_in_last_col_1[4 + well_int].top(z=-2), rate=0.5
                )
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                d = rxn_in_last_col_1[4 + well_int].diameter
                d_12: float = d if d is not None else 6.96
                p1k_1.move_to(
                    rxn_in_last_col_1[4 + well_int]
                    .top(z=-2)
                    .move(types.Point(x=touch * (d_12 / 2 + 0.05)))
                )
                p1k_1.default_speed *= 20
            p1k_1.aspirate(
                sheath_well * (num_well_in_last_col - 4), sf_loc.bottom(z=2), rate=0.25
            )  # slowed down
            ctx.delay(seconds=2)
            d = rxn_in_last_col_2[4 + well].diameter
            d_13: float = d if d is not None else 6.96
            for well in range(num_well_in_last_col - 4):
                p1k_1.dispense(
                    sheath_well, rxn_in_last_col_2[4 + well].top(z=-2), rate=0.5
                )
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                p1k_1.move_to(
                    rxn_in_last_col_2[4 + well]
                    .top(z=-2)
                    .move(types.Point(x=touch * (d_13 / 2 + 0.05)))
                )
                p1k_1.default_speed *= 20
        else:
            p1k_1.aspirate(
                sheath_well * num_well_in_last_col, sf_loc.bottom(z=2), rate=0.25
            )  # slowed down
            ctx.delay(seconds=1)
            for well in range(num_well_in_last_col):
                p1k_1.dispense(sheath_well, rxn_in_last_col_1[well].top(z=-2), rate=0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                d = rxn_in_last_col_1[well].diameter
                d_14: float = d if d is not None else 6.96
                p1k_1.move_to(
                    rxn_in_last_col_1[well]
                    .top(z=-2)
                    .move(types.Point(x=touch * (d_14 / 2 + 0.05)))
                )
                p1k_1.default_speed *= 20
            p1k_1.aspirate(
                sheath_well * num_well_in_last_col, sf_loc.bottom(z=2), rate=0.25
            )  # slowed down
            ctx.delay(seconds=1)
            for well in range(num_well_in_last_col):
                p1k_1.dispense(sheath_well, rxn_in_last_col_2[well].top(z=-2), rate=0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                d = rxn_in_last_col_2[well].diameter
                d_15: float = d if d is not None else 6.96
                p1k_1.move_to(
                    rxn_in_last_col_2[well]
                    .top(z=-2)
                    .move(types.Point(x=touch * (d_15 / 2 + 0.05)))
                )
                p1k_1.default_speed *= 20

        if dry_run:
            p1k_1.return_tip()
        else:
            p1k_1.drop_tip()

    if plate_covering == 1:
        cover()

    elif plate_covering == 2:
        hs.open_labware_latch()
        ctx.pause("Seal Assay Plate")
        hs.close_labware_latch()

    hs.set_and_wait_for_shake_speed(rpm=SPEED_SHAKE)
    ctx.delay(minutes=0.1 if dry_run else 5)
    hs.deactivate_shaker()
    hs.open_labware_latch()
