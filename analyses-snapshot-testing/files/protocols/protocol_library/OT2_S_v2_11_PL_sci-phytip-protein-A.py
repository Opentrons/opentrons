def get_values(*names):
    import json
    _all_values = json.loads("""{"num_samp": 96, "m300_mount": "left"}""")
    return [_all_values[n] for n in names]


metadata = {'protocolName':
    'Phytip Protein A, ProPlus, ProPlus LX Columns - Plate Prep', 'author':
    'Boren Lin', 'source': '', 'apiLevel': '2.11'}


def run(ctx):
    [num_samp, m300_mount] = get_values('num_samp', 'm300_mount')
    VOL_EQL = 200
    VOL_SAMPLE = 200
    VOL_WASH1 = 200
    VOL_WASH2 = 200
    VOL_ELN = 80
    total_cols = int(num_samp // 8)
    r1 = int(num_samp % 8)
    if r1 != 0:
        total_cols = total_cols + 1
    tiprack300 = [ctx.load_labware('opentrons_96_tiprack_300ul', '6')]
    m300 = ctx.load_instrument('p300_multi_gen2', m300_mount, tip_racks=
        tiprack300)
    equilibration_plate = ctx.load_labware(
        'thermoscientific_96_wellplate_v_450', '9', 'equilibration plate')
    wash1_plate = ctx.load_labware('thermoscientific_96_wellplate_v_450',
        '5', 'wash plate 1')
    wash2_plate = ctx.load_labware('thermoscientific_96_wellplate_v_450',
        '7', 'wash plate 2')
    elution_plate = ctx.load_labware('thermoscientific_96_wellplate_v_450',
        '11', 'elute plate')
    eql = equilibration_plate.rows()[0][:total_cols]
    wash1 = wash1_plate.rows()[0][:total_cols]
    wash2 = wash2_plate.rows()[0][:total_cols]
    eln = elution_plate.rows()[0][:total_cols]
    reagents = ctx.load_labware('nest_12_reservoir_15ml', '8', 'reagents')
    (eql1_stock, eql2_stock, wash11_stock, wash12_stock, wash21_stock,
        wash22_stock, eln1_stock, eln2_stock) = ([reagents.wells()[0],
        reagents.wells()[1], reagents.wells()[2], reagents.wells()[3],
        reagents.wells()[4], reagents.wells()[5], reagents.wells()[6],
        reagents.wells()[7]])

    def reagent_transfer(start1, start2, end, vol, cols):
        if vol > 100:
            vol1 = 100
            vol2 = vol - 100
            m300.mix(2, vol1, start1)
            for i in range(cols):
                m300.aspirate(vol1, start1)
                m300.dispense(vol1, end[i].top(z=-2), rate=0.5)
                m300.touch_tip()
            m300.mix(2, vol2, start2)
            for i in range(cols):
                m300.aspirate(vol2, start2)
                m300.dispense(vol2, end[i].top(z=-2), rate=0.5)
                m300.touch_tip()
        else:
            m300.mix(2, vol, start1)
            for i in range(cols):
                m300.aspirate(vol, start1)
                m300.dispense(vol, end[i].top(z=-2), rate=0.5)
                m300.touch_tip()
    m300.pick_up_tip()
    reagent_transfer(eql1_stock, eql2_stock, eql, VOL_EQL, total_cols)
    reagent_transfer(wash11_stock, wash12_stock, wash1, VOL_WASH1, total_cols)
    reagent_transfer(wash21_stock, wash22_stock, wash2, VOL_WASH2, total_cols)
    reagent_transfer(eln1_stock, eln2_stock, eln, VOL_ELN, total_cols)
    m300.drop_tip()
