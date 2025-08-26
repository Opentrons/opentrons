metadata = {
    "protocolName": "Protein Quantification and Normalization - Part 2: Normalized Sample Preparation",
    "author": "Boren Lin, Opentrons",
    "description": "Protein samples normalized to a set volume and concentration using data colleted from BCA assay 1",
}

requirements = {"robotType": "Flex", "apiLevel": "2.20"}

########################

VOL_PIPET_LIMIT = 5


def add_parameters(parameters):
    parameters.add_csv_file(variable_name="csv_data", display_name="Readings of Samples", description="Absorbance reading of each sample")
    parameters.add_int(
        variable_name="num_sample",
        display_name="Number of Samples",
        description="Number of samples to be assayed (maximum: 40)",
        default=40,
        minimum=1,
        maximum=40,
    )
    parameters.add_int(
        variable_name="sample_labware",
        display_name="Sample Labware",
        description="Labware used for samples?",
        default=1,
        choices=[{"display_name": "24 Tube Rack with 1.5mL Tubes", "value": 1}, {"display_name": "2mL 96-Well Plate ", "value": 2}],
    )
    parameters.add_float(
        variable_name="std_1",
        display_name="Standard #1",
        description="1st standard concentration (highest)",
        default=1000,
        minimum=20,
        maximum=2000,
        unit="ng/µL",
    )
    parameters.add_float(
        variable_name="std_2",
        display_name="Standard #2",
        description="2nd standard concentration",
        default=500,
        minimum=20,
        maximum=2000,
        unit="ng/µL",
    )
    parameters.add_float(
        variable_name="std_3",
        display_name="Standard #3",
        description="3rd standard concentration",
        default=250,
        minimum=20,
        maximum=2000,
        unit="ng/µL",
    )
    parameters.add_float(
        variable_name="std_4",
        display_name="Standard #4",
        description="4th standard concentration",
        default=125,
        minimum=20,
        maximum=2000,
        unit="ng/µL",
    )
    parameters.add_float(
        variable_name="std_5",
        display_name="Standard #5",
        description="5th standard concentration",
        default=62.5,
        minimum=20,
        maximum=2000,
        unit="ng/µL",
    )
    parameters.add_float(
        variable_name="std_6",
        display_name="Standard #6",
        description="6th standard concentration (lowest)",
        default=31.5,
        minimum=20,
        maximum=2000,
        unit="ng/µL",
    )
    parameters.add_float(
        variable_name="dilution_1",
        display_name="First Dilution",
        description="Samples will be diluted for 1x, 0.5x, 0.2x?",
        default=1,
        choices=[{"display_name": "1x", "value": 1}, {"display_name": "0.5x", "value": 0.5}, {"display_name": "0.2x", "value": 0.2}],
    )
    parameters.add_float(
        variable_name="dilution_2",
        display_name="Second Dilution",
        description="Samples will be diluted for 1x, 0.5x, 0.2x?",
        default=0.5,
        choices=[{"display_name": "1x", "value": 1}, {"display_name": "0.5x", "value": 0.5}, {"display_name": "0.2x", "value": 0.2}],
    )
    parameters.add_int(
        variable_name="vol_final",
        display_name="Normalized Sample Volume",
        description="Target volume of each sample after normalization?",
        default=100,
        minimum=10,
        maximum=100,
        unit="µL",
    )
    parameters.add_int(
        variable_name="amount_final",
        display_name="Protein Amount",
        description="Amount of protein in each sample after normalization?",
        default=100,
        minimum=1,
        maximum=190,
        unit="µg",
    )
    parameters.add_int(
        variable_name="pipet_location",
        display_name="P1000 1-ch Position",
        description="How P1000 single channel pipette is mounted?",
        default=1,
        choices=[{"display_name": "on the right", "value": 1}, {"display_name": "on the left", "value": 2}],
    )


def run(ctx):

    global num_sample
    global sample_labware

    global std_1
    global std_2
    global std_3
    global std_4
    global std_5
    global std_6

    global dilution_1
    global dilution_2

    global vol_final
    global amount_final

    global pipet_location

    parsed_csv = ctx.params.csv_data.parse_as_csv()

    num_sample = ctx.params.num_sample
    sample_labware = ctx.params.sample_labware

    std_1 = ctx.params.std_1
    std_2 = ctx.params.std_2
    std_3 = ctx.params.std_3
    std_4 = ctx.params.std_4
    std_5 = ctx.params.std_5
    std_6 = ctx.params.std_6

    dilution_1 = ctx.params.dilution_1
    dilution_2 = ctx.params.dilution_2

    vol_final = ctx.params.vol_final
    amount_final = ctx.params.amount_final

    pipet_location = ctx.params.pipet_location

    conc_std = [std_1, std_2, std_3, std_4, std_5, std_6]
    for chk in range(5):
        if conc_std[chk] <= conc_std[chk + 1]:
            raise Exception("Invalid Standards")

    if pipet_location == 1:
        p1k_1_loc = "right"
        p1k_8_loc = "left"
    else:
        p1k_1_loc = "left"
        p1k_8_loc = "right"

    # raw data corrected by blank

    od_full_plate = []
    for col in range(12):
        for row in range(8):
            od_full_plate.append(float(parsed_csv[row + 1][col + 1]))

    od_blk = round((od_full_plate[7] + od_full_plate[7 + 8]) / 2, 3)

    for k in range(96):
        od_full_plate[k] = od_full_plate[k] - od_blk
        if od_full_plate[k] < 0:
            od_full_plate[k] = -1

    od_pc = round((od_full_plate[6] + od_full_plate[6 + 8]) / 2 - od_blk, 3)
    ctx.pause("Positive Control OD: " + str(od_pc))

    # unknown estimate by point-to-point fit

    od_std = []
    for l in range(6):
        od_std.append(round((od_full_plate[l] + od_full_plate[l + 8]) / 2 - od_blk, 3))
        if l > 0:
            if od_std[l] > od_std[l - 1]:
                raise Exception("Invalid Standards")

    od_unknown_1 = od_full_plate[16 : 16 + num_sample]
    od_unknown_2 = od_full_plate[(16 + num_sample) : (16 + num_sample + num_sample)]

    conc_unknown_1 = []
    conc_unknown_2 = []

    for count in range(num_sample):
        if od_unknown_1[count] < od_std[5] or od_unknown_1[count] > od_std[0]:
            od_unknown_1[count] = -1

        conc_unknown_1.append(-1)

        if od_unknown_2[count] < od_std[5] or od_unknown_2[count] > od_std[0]:
            od_unknown_2[count] = -1

        conc_unknown_2.append(-1)

    for m in range(num_sample):
        for n in range(6):
            if n < 5:
                if od_unknown_1[m] < od_std[n] and od_unknown_1[m] > od_std[n + 1]:
                    conc_unknown_1[m] = (1/dilution_1) * (
                        round(
                            (
                                od_unknown_1[m] * (conc_std[n + 1] - conc_std[n])
                                - od_std[n] * (conc_std[n + 1] - conc_std[n])
                                + conc_std[n] * (od_std[n + 1] - od_std[n])
                            )
                            / (od_std[n + 1] - od_std[n]),
                            3,
                        )
                    )

                if od_unknown_2[m] < od_std[n] and od_unknown_2[m] > od_std[n + 1]:
                    conc_unknown_2[m] = (1/dilution_2) * (
                        round(
                            (
                                od_unknown_2[m] * (conc_std[n + 1] - conc_std[n])
                                - od_std[n] * (conc_std[n + 1] - conc_std[n])
                                + conc_std[n] * (od_std[n + 1] - od_std[n])
                            )
                            / (od_std[n + 1] - od_std[n]),
                            3,
                        )
                    )

        if od_unknown_1[m] == od_std[n]:
            conc_unknown_1[m] = (1/dilution_1) * round(conc_std[n], 3)
        if od_unknown_2[m] == od_std[n]:
            conc_unknown_2[m] = (1/dilution_2) * round(conc_std[n], 3)

    # volume for transfer

    conc_unknown_final = []

    for x in range(num_sample):
        if conc_unknown_1[x] > 0:
            if conc_unknown_2[x] > 0:
                conc_unknown_final.append((conc_unknown_1[x]+conc_unknown_2[x])/2)
            else:
                conc_unknown_final.append(conc_unknown_1[x])
        else:
            if conc_unknown_2[x] > 0:
                conc_unknown_final.append(conc_unknown_2[x])         
            else:
                conc_unknown_final.append(-1)

    conc_final = amount_final * 1000 / vol_final

    vol_unknown = []
    vol_diluent = []

    for y in range(num_sample):
        if conc_unknown_final[y] < 0:
            ctx.pause("Sample #" + str(y + 1) + ": Out of assay range")
            vol_unknown.append(-1)
            vol_diluent.append(-1)
        else:
            if conc_unknown_final[y] < conc_final:
                ctx.pause("Sample #" + str(y + 1) + ": Estimated concentration lower than target concentration")
                vol_unknown.append(-1)
                vol_diluent.append(-1)
            else:
                vol = int(round(vol_final * conc_final / conc_unknown_final[y]))

                if vol < VOL_PIPET_LIMIT:
                    ctx.pause("Sample #" + str(y + 1) + ": Sample volume to be transferred lower than pipette limit")
                    vol_unknown.append(-1)
                    vol_diluent.append(-1)
                elif vol_final - vol < VOL_PIPET_LIMIT:
                    ctx.pause("Sample #" + str(y + 1) + ": Diluent volume to be transferred lower than pipette limit")
                    vol_unknown.append(-1)
                    vol_diluent.append(-1)
                else:
                    vol_unknown.append(vol)
                    vol_diluent.append(vol_final - vol)

    # normalized sample prep

    ## deck layout
    if sample_labware == 1:
        if num_sample > 24:
            sample_rack_1 = ctx.load_labware("opentrons_24_tuberack_nest_1.5ml_snapcap", "C1", "SAMPLES")
            sample_rack_2 = ctx.load_labware("opentrons_24_tuberack_nest_1.5ml_snapcap", "B1", "SAMPLES")
            sample_1 = sample_rack_1.wells()[:24]
            sample_2 = sample_rack_2.wells()[: (num_sample - 24)]
        else:
            sample_rack_1 = ctx.load_labware("opentrons_24_tuberack_nest_1.5ml_snapcap", "C1", "SAMPLES")
            sample_1 = sample_rack_1.wells()[:num_sample]

    elif sample_labware == 2:
        sample_rack_1 = ctx.load_labware("nest_96_wellplate_2ml_deep", "C1", "SAMPLES")
        sample_1 = sample_rack_1.wells()[:num_sample]

    buffer_rack = ctx.load_labware("opentrons_10_tuberack_nest_4x50ml_6x15ml_conical", "A2", "DILUENT")
    diluent = buffer_rack.wells()[2]

    final_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "C2", "NORMALIZED SAMPLES")
    final = final_plate.wells()[:num_sample]

    ctx.load_trash_bin("A3")

    tips_200 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "B3", "P200 TIPS")
    # tips_1000_loc = tips_1000.wells()[:96]
    tips_50 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "C3", "P50 TIPS")
    # tips_50_loc = tips_50.wells()[:96]
    p1k_1 = ctx.load_instrument("flex_1channel_1000", p1k_1_loc)
    ctx.load_instrument("flex_8channel_1000", p1k_8_loc)

    ## volume info
    vol_unkwn = 250
    if sample_labware == 1:
        if num_sample > 24:
            def_1 = ctx.define_liquid(name="Samples", description="Samples, per tube or well (Slot C1)", display_color="#FF0000")  ## Red
            def_2 = ctx.define_liquid(name="Samples", description="Samples, per tube or well (Slot B1)", display_color="#FF0000")  ## Red
            for p in range(24):
                sample_rack_1.wells()[p].load_liquid(liquid=def_1, volume=vol_unkwn / 24)
            for q in range(num_sample - 24):
                sample_rack_2.wells()[q].load_liquid(liquid=def_2, volume=vol_unkwn / (num_sample - 24))
        else:
            def_1 = ctx.define_liquid(name="Samples", description="Samples, per tube (Slot C1)", display_color="#FF0000")  ## Red
            for p in range(num_sample):
                sample_rack_1.wells()[p].load_liquid(liquid=def_1, volume=vol_unkwn / num_sample)
    else:
        def_1 = ctx.define_liquid(name="Samples", description="Samples, per well (Slot C1)", display_color="#FF0000")  ## Red
        for p in range(num_sample):
            sample_rack_1.wells()[p].load_liquid(liquid=def_1, volume=vol_unkwn / num_sample)

    vol_dilu = 5000
    def_dilu = ctx.define_liquid(name="Diluent", description="Buffer for dilution, per tube", display_color="#8B8000")  ## Yellow
    buffer_rack.wells()[2].load_liquid(liquid=def_dilu, volume=vol_dilu)

    ## add buffer
    i_200 = []
    i_50 = []
    for i, vol in enumerate(vol_diluent):
        if vol > 0:
            if vol > 30:
                i_200.append(i)
            else:
                i_50.append(i)

    count_200 = len(i_200)
    count_50 = len(i_50)

    if count_200 > 0:
        p1k_1.tip_racks = [tips_200]
        p1k_1.pick_up_tip()

        for j in range(count_200):
            vol = vol_diluent[i_200[j]]
            well = i_200[j]

            p1k_1.flow_rate.aspirate = vol * 2
            p1k_1.flow_rate.dispense = vol * 2

            p1k_1.aspirate(vol, diluent)
            ctx.delay(seconds=1)
            p1k_1.dispense(vol, final[well])
            ctx.delay(seconds=1)
            p1k_1.blow_out(final[well].bottom(z=12))

        p1k_1.drop_tip()

    if count_50 > 0:
        p1k_1.tip_racks = [tips_50]
        p1k_1.pick_up_tip()

        for j in range(count_50):
            vol = vol_diluent[i_50[j]]
            well = i_50[j]

            p1k_1.flow_rate.aspirate = vol * 2
            p1k_1.flow_rate.dispense = vol * 2

            p1k_1.aspirate(vol, diluent)
            ctx.delay(seconds=1)
            p1k_1.dispense(vol, final[well])
            ctx.delay(seconds=1)
            p1k_1.blow_out(final[well].bottom(z=12))

        p1k_1.drop_tip()

    ## add samples
    for j, vol in enumerate(vol_unknown):
        if vol > 0:
            if vol > 30:
                p1k_1.tip_racks = [tips_200]
            else:
                p1k_1.tip_racks = [tips_50]

            if sample_labware == 1:
                if j < 24:
                    source = sample_1[j]
                else:
                    source = sample_2[j - 24]
            else:
                source = sample_1[j]

            p1k_1.flow_rate.aspirate = vol
            p1k_1.flow_rate.dispense = vol

            p1k_1.pick_up_tip()

            p1k_1.aspirate(5, source.top(z=0))
            p1k_1.aspirate(vol, source)
            ctx.delay(seconds=1)
            p1k_1.dispense(vol + 2, final[j].bottom(z=8))

            p1k_1.flow_rate.aspirate = 300
            p1k_1.flow_rate.dispense = 300
            p1k_1.mix(2, vol_final * 0.3, final[j].bottom(z=4))
            ctx.delay(seconds=1)
            p1k_1.blow_out(final[j].bottom(z=12))

            p1k_1.drop_tip()
