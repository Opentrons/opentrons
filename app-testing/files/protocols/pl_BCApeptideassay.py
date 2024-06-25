metadata = {"protocolName": "Pierce BCA Peptide Assay", "author": "Boren Lin, Opentrons", "description": ""}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.18",
}

########################

NUM_REPLICATE = 2
VOL_SAMPLE = 20
VOL_WR = 180


def add_parameters(parameters):
    parameters.add_int(
        variable_name="reagent_prep_on_deck",
        display_name="Working reagent prep on deck",
        description="Prepare working reagent (Reagent A and B mixture) on deck?",
        default=1,
        choices=[{"display_name": "Yes", "value": 1}, {"display_name": "No", "value": 0}],
    )
    parameters.add_int(
        variable_name="dilution_on_deck",
        display_name="Samples diluted on deck",
        description="Prepare sample dilutions (2-fold serial dilutions: 1x, 0.5x, 0.25x, 0.125x)?",
        default=0,
        choices=[{"display_name": "Yes", "value": 1}, {"display_name": "No", "value": 0}],
    )
    parameters.add_int(
        variable_name="heating",
        display_name="Heating module",
        description="Color development - incubation on Heater-shaker Module or Temperature Module?",
        default=1,
        choices=[{"display_name": "Heater-shaker Module", "value": 1}, {"display_name": "Temperature Module", "value": 2}],
    )
    parameters.add_int(
        variable_name="time_incubation",
        display_name="Incubation Time",
        description="Color development - incubation for how long (min)?",
        default=15,
        minimum=0,
        maximum=120,
    )
    parameters.add_int(
        variable_name="num_sample",
        display_name="Number of Samples",
        description="Number of samples to be assayed. If samples need to be diluted, maximum: 12",
        default=48,
        minimum=1,
        maximum=48,
    )
    parameters.add_int(
        variable_name="pipet_location",
        display_name="P1000 1-ch Position",
        description="How P1000 single channel pipette is mounted?",
        default=1,
        choices=[{"display_name": "on the right", "value": 1}, {"display_name": "on the left", "value": 2}],
    )


def run(ctx):
    global reagent_prep_on_deck
    global dilution_on_deck
    global heating
    global time_incubation
    global num_sample
    global pipet_location

    global num_sample_initial
    global num_sample_final
    global num_col
    global vol_wr_well_1
    global vol_wr_well_2
    global vol_a_well_1
    global vol_a_well_2
    global vol_b_well_1
    global vol_b_well_2
    global vol_c_well_1
    global vol_c_well_2

    reagent_prep_on_deck = ctx.params.reagent_prep_on_deck
    dilution_on_deck = ctx.params.dilution_on_deck
    heating = ctx.params.heating
    time_incubation = ctx.params.time_incubation
    num_sample = ctx.params.num_sample
    pipet_location = ctx.params.pipet_location

    if dilution_on_deck == 0:
        num_sample_final = num_sample
        ## standard + unknowns, max. 48

    else:
        num_sample_initial = num_sample
        num_sample_final = num_sample * 4
        ## standard + unknowns, max. 12

    if num_sample_final * NUM_REPLICATE > 96 or num_sample_final == 0:
        raise Exception("Invalid sample number")

    num_rxn = num_sample_final * NUM_REPLICATE
    num_col = int(num_rxn // 8)
    if num_rxn % 8 != 0:
        num_col = num_col + 1

    if num_col > 6:
        vol_wr_well_1 = (6 - 1) * VOL_WR * 8 + 2000
        vol_wr_well_2 = (num_col - 6 - 1) * VOL_WR * 8 + 2000

    else:
        vol_wr_well_1 = (num_col - 1) * VOL_WR * 8 + 2000
        vol_wr_well_2 = 0

    vol_a_well_1 = (vol_wr_well_1 / 100) * 50
    vol_a_well_2 = (vol_wr_well_2 / 100) * 50
    vol_b_well_1 = (vol_wr_well_1 / 100) * 48
    vol_b_well_2 = (vol_wr_well_2 / 100) * 48
    vol_c_well_1 = (vol_wr_well_1 / 100) * 2
    vol_c_well_2 = (vol_wr_well_2 / 100) * 2

    if pipet_location == 1:
        p1k_1_loc = "right"
        p1k_8_loc = "left"
    else:
        p1k_1_loc = "left"
        p1k_8_loc = "right"

    # deck layout
    if heating == 1:
        hs = ctx.load_module("heaterShakerModuleV1", "D1")
        hs_adapter = hs.load_adapter("opentrons_universal_flat_adapter")

    elif heating == 2:
        temp = ctx.load_module("Temperature Module Gen2", "D3")
        temp_adapter = temp.load_adapter("opentrons_aluminum_flat_bottom_plate")

    if reagent_prep_on_deck == 1 or dilution_on_deck == 1:
        reagent_stock_rack = ctx.load_labware("opentrons_10_tuberack_nest_4x50ml_6x15ml_conical", "A2", "REAGENTS")

    wr_reservoir = ctx.load_labware("nest_12_reservoir_15ml", "B2", "WORKING REAGENT")
    sample_rack_1 = ctx.load_labware("opentrons_24_tuberack_nest_1.5ml_snapcap", "C1", "SAMPLES")
    if num_sample_final > 24:
        sample_rack_2 = ctx.load_labware("opentrons_24_tuberack_nest_1.5ml_snapcap", "B1", "SAMPLES")

    ctx.load_trash_bin("A3")

    if dilution_on_deck == 1:
        tips_200 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "A1", "P200 TIPS")
        tips_200_loc = tips_200.wells()[:96]

    tips_1000 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "B3", "P1000 TIPS")
    tips_1000_loc = tips_1000.wells()[:96]
    tips_50 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "C3", "P50 TIPS")
    tips_50_loc = tips_50.wells()[:96]
    p1k_1 = ctx.load_instrument("flex_1channel_1000", p1k_1_loc)
    p1k_8 = ctx.load_instrument("flex_8channel_1000", p1k_8_loc)

    # liquid location
    if reagent_prep_on_deck == 1:
        reagent_a = reagent_stock_rack.wells()[8]
        reagent_b = reagent_stock_rack.wells()[6]
        reagent_c = reagent_stock_rack.wells()[0]

    if dilution_on_deck == 1:
        buffer = reagent_stock_rack.wells()[2]

    wr_1 = wr_reservoir.wells()[0]
    if num_col > 6:
        wr_2 = wr_reservoir.wells()[1]

    sample_1 = sample_rack_1.wells()[:24]
    if num_sample_final > 24:
        sample_2 = sample_rack_2.wells()[:24]

    ## generate desk layout and volume info
    if reagent_prep_on_deck == 1:
        vol_a = ((num_col - 1) * VOL_WR * 8 + 3000) / 100 * 50
        vol_b = ((num_col - 1) * VOL_WR * 8 + 3000) / 100 * 48
        vol_c = ((num_col - 1) * VOL_WR * 8 + 3000) / 100 * 2
        def_a = ctx.define_liquid(name="Reagent A", description=" ", display_color="#E5E4E2")  ## Gray
        reagent_stock_rack.wells()[8].load_liquid(liquid=def_a, volume=vol_a)
        def_b = ctx.define_liquid(name="Reagent B", description=" ", display_color="#0000FF")  ## Blue
        reagent_stock_rack.wells()[6].load_liquid(liquid=def_b, volume=vol_b)
        def_c = ctx.define_liquid(name="Reagent C", description=" ", display_color="#FFA500")  ## Orange
        reagent_stock_rack.wells()[0].load_liquid(liquid=def_c, volume=vol_c)
    else:
        if num_col > 6:
            vol_1 = (6 - 1) * VOL_WR * 8 + 2000
            vol_2 = (num_col - 6 - 1) * VOL_WR * 8 + 2000
            def_1 = ctx.define_liquid(name="Working Reagent", description=" ", display_color="#50C878")  ## Green
            wr_reservoir.wells()[0].load_liquid(liquid=def_1, volume=vol_1)
            def_2 = ctx.define_liquid(name="Working Reagent", description=" ", display_color="#50C878")  ## Green
            wr_reservoir.wells()[1].load_liquid(liquid=def_2, volume=vol_2)
        else:
            vol_1 = (num_col - 1) * VOL_WR * 8 + 2000
            def_1 = ctx.define_liquid(name="Working Reagent", description=" ", display_color="#50C878")  ## Green
            wr_reservoir.wells()[0].load_liquid(liquid=def_1, volume=vol_1)

    if dilution_on_deck == 1:
        vol_undiluted = (VOL_SAMPLE + 5) * NUM_REPLICATE * 2 + 10
        vol_buffer = (VOL_SAMPLE + 5) * NUM_REPLICATE * 3 * num_sample_initial + 50
        if num_sample_initial > 6:
            def_undiluted_1 = ctx.define_liquid(
                name="Sample", description="Undiluted Samples, volume per tube (Slot C1)", display_color="#FF0000"
            )  ## Red
            def_undiluted_2 = ctx.define_liquid(
                name="Sample", description="Undiluted Samples, volume per tube (Slot B1)", display_color="#FF0000"
            )  ## Red
            for p in range(6):
                sample_rack_1.rows()[0][p].load_liquid(liquid=def_undiluted_1, volume=vol_undiluted / 6)
            for q in range(num_sample_initial - 6):
                sample_rack_2.rows()[0][q].load_liquid(liquid=def_undiluted_2, volume=vol_undiluted / (num_sample_initial - 6))
        else:
            def_undiluted_1 = ctx.define_liquid(
                name="Sample", description="Undiluted Samples, volume per tube (Slot C1)", display_color="#FF0000"
            )  ## Red
            for p in range(num_sample_initial):
                sample_rack_1.rows()[0][p].load_liquid(liquid=def_undiluted_1, volume=vol_undiluted / num_sample_initial)
        def_buffer = ctx.define_liquid(name="Buffer", description="Buffer for sample dilution", display_color="#704848")  ## Brown
        reagent_stock_rack.wells()[2].load_liquid(liquid=def_buffer, volume=vol_buffer)
    else:
        vol_ = VOL_SAMPLE * NUM_REPLICATE + 10
        if num_sample_final > 24:
            def_1 = ctx.define_liquid(name="Sample", description="Samples, volume per tube (Slot C1)", display_color="#FF0000")  ## Red
            def_2 = ctx.define_liquid(name="Sample", description="Samples, volume per tube (Slot B1)", display_color="#FF0000")  ## Red
            for p in range(24):
                sample_rack_1.wells()[p].load_liquid(liquid=def_1, volume=vol_ / 24)
            for q in range(num_sample_final - 24):
                sample_rack_2.wells()[q].load_liquid(liquid=def_2, volume=vol_ / (num_sample_final - 24))
        else:
            def_1 = ctx.define_liquid(name="Sample", description="Samples, volume per tube (Slot C1)", display_color="#FF0000")  ## Red
            for p in range(num_sample_final):
                sample_rack_1.wells()[p].load_liquid(liquid=def_1, volume=vol_ / num_sample_final)

    # protocol
    ## dilution prep
    if dilution_on_deck == 1:
        p1k_1.pick_up_tip(tips_200_loc[0])
        if num_sample_initial > 6:
            for x in range(6):
                p1k_1.aspirate((VOL_SAMPLE + 5) * NUM_REPLICATE * 3, buffer)
                ctx.delay(seconds=2)
                for y in range(3):
                    end = sample_1[y + x * 4 + 1]
                    p1k_1.flow_rate.dispense = VOL_SAMPLE * NUM_REPLICATE
                    p1k_1.dispense((VOL_SAMPLE + 5) * NUM_REPLICATE, end.bottom(z=10))
                    ctx.delay(seconds=2)
                p1k_1.blow_out(buffer.top(z=0))
            for x in range(num_sample_initial - 6):
                p1k_1.aspirate((VOL_SAMPLE + 5) * NUM_REPLICATE * 3, buffer)
                ctx.delay(seconds=2)
                for y in range(3):
                    end = sample_2[y + x * 4 + 1]
                    p1k_1.flow_rate.dispense = VOL_SAMPLE * NUM_REPLICATE
                    p1k_1.dispense((VOL_SAMPLE + 5) * NUM_REPLICATE, end.bottom(z=10))
                    ctx.delay(seconds=2)
        else:
            for x in range(num_sample_initial):
                p1k_1.aspirate((VOL_SAMPLE + 5) * NUM_REPLICATE * 3, buffer)
                ctx.delay(seconds=2)
                for y in range(3):
                    end = sample_1[y + x * 4 + 1]
                    p1k_1.flow_rate.dispense = VOL_SAMPLE * NUM_REPLICATE
                    p1k_1.dispense((VOL_SAMPLE + 5) * NUM_REPLICATE, end.bottom(z=10))
                    ctx.delay(seconds=2)
        p1k_1.drop_tip()

        if num_sample_initial > 6:
            p1k_1.flow_rate.aspirate = VOL_SAMPLE * NUM_REPLICATE
            for x in range(6):
                p1k_1.pick_up_tip(tips_200_loc[x + 1])
                for y in range(3):
                    start = sample_1[x * 4 + y]
                    end = sample_1[x * 4 + y + 1]
                    p1k_1.aspirate((VOL_SAMPLE + 5) * NUM_REPLICATE, start)
                    p1k_1.dispense((VOL_SAMPLE + 5) * NUM_REPLICATE, end.bottom(z=10))
                    p1k_1.flow_rate.aspirate = 200
                    p1k_1.flow_rate.dispense = 200
                    p1k_1.mix(3, VOL_SAMPLE, end)
                    p1k_1.blow_out(end.top(z=-5))
                    ctx.delay(seconds=2)
                p1k_1.drop_tip()
            for x in range(num_sample_initial - 6):
                p1k_1.pick_up_tip(tips_200_loc[x + 7])
                for y in range(3):
                    start = sample_2[x * 4 + y]
                    end = sample_2[x * 4 + y + 1]
                    p1k_1.aspirate((VOL_SAMPLE + 5) * NUM_REPLICATE, start)
                    p1k_1.dispense((VOL_SAMPLE + 5) * NUM_REPLICATE, end.bottom(z=10))
                    p1k_1.flow_rate.aspirate = 200
                    p1k_1.flow_rate.dispense = 200
                    p1k_1.mix(3, VOL_SAMPLE, end)
                    p1k_1.blow_out(end.top(z=-5))
                    ctx.delay(seconds=2)
                p1k_1.drop_tip()
        else:
            p1k_1.flow_rate.aspirate = VOL_SAMPLE * NUM_REPLICATE
            for x in range(num_sample_initial):
                p1k_1.pick_up_tip(tips_200_loc[x + 1])
                for y in range(3):
                    start = sample_1[x * 4 + y]
                    end = sample_1[x * 4 + y + 1]
                    p1k_1.aspirate((VOL_SAMPLE + 5) * NUM_REPLICATE, start)
                    p1k_1.dispense((VOL_SAMPLE + 5) * NUM_REPLICATE, end.bottom(z=10))
                    p1k_1.flow_rate.aspirate = 200
                    p1k_1.flow_rate.dispense = 200
                    p1k_1.mix(3, VOL_SAMPLE, end)
                    p1k_1.blow_out(end.top(z=-5))
                    ctx.delay(seconds=2)
                p1k_1.drop_tip()

    ## working reagent prep
    if reagent_prep_on_deck == 1:
        p1k_1.pick_up_tip(tips_1000_loc[0])
        n = int(vol_a_well_1 // 900)
        for _ in range(n):
            p1k_1.aspirate(900, reagent_a)
            ctx.delay(seconds=2)
            p1k_1.dispense(900, wr_1.top(z=0))
            ctx.delay(seconds=2)
        if vol_a_well_1 % 900 != 0:
            vol_last = vol_a_well_1 - (900 * n)
            p1k_1.aspirate(vol_last, reagent_a)
            ctx.delay(seconds=2)
            p1k_1.dispense(vol_last, wr_1.top(z=0))
            ctx.delay(seconds=2)
        if num_col > 6:
            nn = int(vol_a_well_2 // 900)
            for _ in range(nn):
                p1k_1.aspirate(900, reagent_a)
                ctx.delay(seconds=2)
                p1k_1.dispense(900, wr_2.top(z=0))
                ctx.delay(seconds=2)
            if vol_a_well_2 % 900 != 0:
                vol_last = vol_a_well_2 - (900 * nn)
                p1k_1.aspirate(vol_last, reagent_a)
                ctx.delay(seconds=2)
                p1k_1.dispense(vol_last, wr_2.top(z=0))
                ctx.delay(seconds=2)
        p1k_1.drop_tip()

        p1k_1.pick_up_tip(tips_1000_loc[1])
        n = int(vol_b_well_1 // 900)
        for _ in range(n):
            p1k_1.aspirate(900, reagent_b)
            ctx.delay(seconds=2)
            p1k_1.dispense(900, wr_1.top(z=0))
            ctx.delay(seconds=2)
        if vol_b_well_1 % 900 != 0:
            vol_last = vol_b_well_1 - (900 * n)
            p1k_1.aspirate(vol_last, reagent_b)
            ctx.delay(seconds=2)
            p1k_1.dispense(vol_last, wr_1.top(z=0))
            ctx.delay(seconds=2)
        if num_col > 6:
            nn = int(vol_b_well_2 // 900)
            for _ in range(nn):
                p1k_1.aspirate(900, reagent_b)
                ctx.delay(seconds=2)
                p1k_1.dispense(900, wr_2.top(z=0))
                ctx.delay(seconds=2)
            if vol_b_well_2 % 900 != 0:
                vol_last = vol_b_well_2 - (900 * nn)
                p1k_1.aspirate(vol_last, reagent_b)
                ctx.delay(seconds=2)
                p1k_1.dispense(vol_last, wr_2.top(z=0))
                ctx.delay(seconds=2)
        p1k_1.drop_tip()

        p1k_1.pick_up_tip(tips_1000_loc[2])
        p1k_1.aspirate(vol_c_well_1, reagent_c)
        ctx.delay(seconds=2)
        p1k_1.dispense(vol_c_well_1, wr_1)
        ctx.delay(seconds=2)
        p1k_1.blow_out(wr_1.top(z=0))
        if num_col > 6:
            p1k_1.aspirate(vol_c_well_2, reagent_c)
            ctx.delay(seconds=2)
            p1k_1.dispense(vol_c_well_2, wr_2)
            ctx.delay(seconds=2)
            p1k_1.blow_out(wr_2.top(z=0))
        p1k_1.drop_tip()

    ## working plate filling
    working_plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "C2", "WORKING PLATE")
    working_plate_lid = ctx.load_labware("corning_96_wellplate_360ul_flat", "D2", "PLATE LID")
    rxn_col = working_plate.rows()[0][:12]
    rxn_well = working_plate.wells()[:96]

    ### add working reagent
    if reagent_prep_on_deck == 1:
        p1k_8.pick_up_tip(tips_1000_loc[8])
        if num_col > 6:
            for _ in range(20):
                p1k_8.aspirate(VOL_WR, wr_2)
                p1k_8.dispense(VOL_WR, wr_2.top(z=0))
        for _ in range(20):
            p1k_8.aspirate(VOL_WR, wr_1)
            p1k_8.dispense(VOL_WR, wr_1.top(z=0))
    else:
        p1k_8.pick_up_tip(tips_1000_loc[0])

    if num_col > 6:
        for i in range(2):
            p1k_8.aspirate(VOL_WR * 3, wr_1)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[i * 3]
            p1k_8.dispense(20, end.top(z=0))
            for j in range(3):
                end = rxn_col[i * 3 + j]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)
        col = num_col - 6
        if col > 3:
            p1k_8.aspirate(VOL_WR * 3, wr_2)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[6]
            p1k_8.dispense(20, end.top(z=0))
            for jj in range(3):
                end = rxn_col[6 + jj]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)
            ii = col - 3
            p1k_8.aspirate(VOL_WR * ii, wr_2)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[9]
            p1k_8.dispense(20, end.top(z=0))
            for iii in range(ii):
                end = rxn_col[9 + iii]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)
        else:
            p1k_8.aspirate(VOL_WR * col, wr_2)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[6]
            p1k_8.dispense(20, end.top(z=0))
            for jjj in range(col):
                end = rxn_col[6 + jjj]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)
    else:
        if num_col > 3:
            p1k_8.aspirate(VOL_WR * 3, wr_1)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[0]
            p1k_8.dispense(20, end.top(z=0))
            for g in range(3):
                end = rxn_col[g]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)
            col = num_col - 3
            p1k_8.aspirate(VOL_WR * col, wr_1)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[3]
            p1k_8.dispense(20, end.top(z=0))
            for h in range(col):
                end = rxn_col[3 + h]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)
        else:
            p1k_8.aspirate(VOL_WR * num_col, wr_1)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[0]
            p1k_8.dispense(20, end.top(z=0))
            for hh in range(num_col):
                end = rxn_col[hh]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)

    p1k_8.drop_tip()

    ### add samples
    if num_sample_final > 24:
        for tube in range(24):
            p1k_1.flow_rate.aspirate = VOL_SAMPLE * NUM_REPLICATE
            p1k_1.flow_rate.dispense = VOL_SAMPLE * NUM_REPLICATE
            p1k_1.pick_up_tip(tips_50_loc[tube])
            start = sample_1[tube]
            p1k_1.aspirate(VOL_SAMPLE * NUM_REPLICATE, start)
            ctx.delay(seconds=2)
            for count in range(NUM_REPLICATE):
                end = rxn_well[tube * 2 + count]
                p1k_1.dispense(VOL_SAMPLE, end.bottom(z=2))
                ctx.delay(seconds=2)
            if heating == 2:
                for count in reversed(range(NUM_REPLICATE)):
                    p1k_1.flow_rate.aspirate = 200
                    p1k_1.flow_rate.dispense = 200
                    end = rxn_well[tube * 2 + count]
                    p1k_1.mix(3, 45, end)
                    p1k_1.blow_out(end.top(z=0))
            p1k_1.drop_tip()

        for tube in range(num_sample_final - 24):
            p1k_1.flow_rate.aspirate = VOL_SAMPLE * NUM_REPLICATE
            p1k_1.flow_rate.dispense = VOL_SAMPLE * NUM_REPLICATE
            p1k_1.pick_up_tip(tips_50_loc[24 + tube])
            start = sample_2[tube]
            p1k_1.aspirate(VOL_SAMPLE * NUM_REPLICATE, start)
            ctx.delay(seconds=2)
            for count in range(NUM_REPLICATE):
                end = rxn_well[48 + tube * 2 + count]
                p1k_1.dispense(VOL_SAMPLE, end.bottom(z=2))
                ctx.delay(seconds=2)
            if heating == 2:
                for count in reversed(range(NUM_REPLICATE)):
                    p1k_1.flow_rate.aspirate = 200
                    p1k_1.flow_rate.dispense = 200
                    end = rxn_well[48 + tube * 2 + count]
                    p1k_1.mix(3, 45, end)
                    p1k_1.blow_out(end.top(z=0))
            p1k_1.drop_tip()

    else:
        for tube in range(num_sample_final):
            p1k_1.flow_rate.aspirate = VOL_SAMPLE * NUM_REPLICATE
            p1k_1.flow_rate.dispense = VOL_SAMPLE * NUM_REPLICATE
            p1k_1.pick_up_tip(tips_50_loc[tube])
            start = sample_1[tube]
            p1k_1.aspirate(VOL_SAMPLE * NUM_REPLICATE, start)
            ctx.delay(seconds=2)
            for count in range(NUM_REPLICATE):
                end = rxn_well[tube * 2 + count]
                p1k_1.dispense(VOL_SAMPLE, end.bottom(z=2))
                ctx.delay(seconds=2)
            if heating == 2:
                for count in reversed(range(NUM_REPLICATE)):
                    p1k_1.flow_rate.aspirate = 200
                    p1k_1.flow_rate.dispense = 200
                    end = rxn_well[tube * 2 + count]
                    p1k_1.mix(3, 45, end)
                    p1k_1.blow_out(end.top(z=0))
            p1k_1.drop_tip()

    if heating == 1:
        hs.open_labware_latch()
        ctx.move_labware(
            labware=working_plate,
            new_location=hs_adapter,
            use_gripper=True,
        )
        hs.close_labware_latch()
        hs.set_and_wait_for_shake_speed(rpm=1250)
        ctx.delay(seconds=30)
        hs.deactivate_shaker()
        hs.open_labware_latch()
        ctx.move_labware(
            labware=working_plate,
            new_location="C2",
            use_gripper=True,
        )

    del ctx.deck["C2"]
    ctx.move_labware(
        labware=working_plate_lid,
        new_location="C2",
        use_gripper=True,
        pick_up_offset={"x": 0, "y": 0, "z": -4},
        drop_offset={"x": 0, "y": 0, "z": 3},
    )
    del ctx.deck["C2"]
    working_plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "C2", "WORKING PLATE")

    ## incubation
    if heating == 1:
        hs.set_and_wait_for_temperature(37)
        heat_pad = hs_adapter
        h = -8
    elif heating == 2:
        temp.set_temperature(37)
        heat_pad = temp_adapter
        h = -10

    ctx.move_labware(
        labware=working_plate,
        new_location=heat_pad,
        use_gripper=True,
        pick_up_offset={"x": 0, "y": 0, "z": -7},
        drop_offset={"x": 0, "y": 0, "z": h},
    )
    ctx.delay(minutes=time_incubation)
    if heating == 1:
        hs.deactivate_heater()
    elif heating == 2:
        temp.deactivate()

    ctx.pause("Measure absorbance at 480 nm on a plate reader")
