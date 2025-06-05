def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "num_samp", "type": "int", "label": "Number of Samples", "default": 96}, {"name": "m300_mount", "type": "dropDown", "label": "P300 Multi-Channel Mount", "options": [{"label": "Left", "value": "left"}, {"label": "Right", "value": "right"}]}]""")
    return [_all_values[n] for n in names]


metadata = {'protocolName':
    'Phytip Protein A, ProPlus, ProPlus LX Columns - Protein Purification',
    'author': '', 'source': '', 'apiLevel': '2.11'}


def run(ctx):
    [num_samp, m300_mount] = get_values('num_samp', 'm300_mount')
    VOL_EQL = 200
    VOL_SAMPLE = 200
    VOL_WASH1 = 200
    VOL_WASH2 = 200
    VOL_ELN = 80
    CYCLES_EQL = 4
    CYCLES_SAMPLE = 8
    CYCLES_WASH1 = 2
    CYCLES_WASH2 = 2
    CYCLES_ELN = 4
    FLOWRATE_EQL = 4
    FLOWRATE_SAMPLE = 4
    FLOWRATE_WASH1 = 8
    FLOWRATE_WASH2 = 8
    FLOWRATE_ELN = 4
    total_cols = int(num_samp // 8)
    r1 = int(num_samp % 8)
    if r1 != 0:
        total_cols = total_cols + 1
    phytiprack = ctx.load_labware('phytips_in_opentrons_box_96_300ul', '3',
        '300ul resin tiprack')
    sample_plate = ctx.load_labware('thermoscientific_96_wellplate_v_450',
        '2', 'samples plate')
    equilibration_plate = ctx.load_labware(
        'thermoscientific_96_wellplate_v_450', '9', 'equilibration plate')
    wash1_plate = ctx.load_labware('thermoscientific_96_wellplate_v_450',
        '5', 'wash plate 1')
    wash2_plate = ctx.load_labware('thermoscientific_96_wellplate_v_450',
        '7', 'wash plate 2')
    elution_plate = ctx.load_labware('thermoscientific_96_wellplate_v_450',
        '11', 'elute plate')
    sample = sample_plate.rows()[0][:total_cols]
    eql = equilibration_plate.rows()[0][:total_cols]
    wash1 = wash1_plate.rows()[0][:total_cols]
    wash2 = wash2_plate.rows()[0][:total_cols]
    eln = elution_plate.rows()[0][:total_cols]
    m300 = ctx.load_instrument('p300_multi_gen2', m300_mount, tip_racks=[
        phytiprack])

    def plate_mix(cycles, volume, loc, rate, delay=20):
        m300.flow_rate.aspirate = rate
        m300.flow_rate.dispense = rate
        for _ in range(cycles):
            m300.aspirate(volume, loc.bottom(1.5))
            ctx.delay(seconds=delay)
            m300.dispense(volume, loc.bottom(1.5))
            ctx.delay(seconds=5)
    for col in range(total_cols):
        tip_loc = phytiprack.rows()[0][col]
        m300.pick_up_tip(tip_loc)
        plate_mix(CYCLES_EQL, VOL_EQL * 0.9, eql[col], FLOWRATE_EQL)
        plate_mix(CYCLES_SAMPLE, VOL_SAMPLE * 0.9, sample[col], FLOWRATE_SAMPLE
            )
        plate_mix(CYCLES_WASH1, VOL_WASH1 * 0.9, wash1[col], FLOWRATE_WASH1)
        plate_mix(CYCLES_WASH2, VOL_WASH2 * 0.9, wash2[col], FLOWRATE_WASH2)
        plate_mix(CYCLES_ELN, VOL_ELN + 50, eln[col], FLOWRATE_ELN)
        m300.return_tip()
