def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "NUM_MASTERMIX", "type": "dropDown", "label": "Number of mastermix", "options": [{"label": "1", "value": 1}, {"label": "2", "value": 2}, {"label": "3", "value": 3}, {"label": "4", "value": 4}, {"label": "6", "value": 6}, {"label": "12", "value": 12}]}, {"name": "p300_mount", "type": "dropDown", "label": "P300 Single-Channel Mount", "options": [{"label": "Left", "value": "left"}, {"label": "Right", "value": "right"}]}]""")
    return [_all_values[n] for n in names]


# flake8: noqa

metadata = {
    'protocolName': 'Luciferase Reporter Assay for NF-kB Activation - Protocol 2: Transfection of Luciferase Reporter Construct',
    'author': 'Boren Lin, Opentrons',
    'source': 'Custom Protocol Request',
    'apiLevel': '2.13'
}


def run(ctx):
    mastermix_tube = 'opentrons_24_tuberack_nest_2ml_snapcap'

    [NUM_MASTERMIX, p300_mount] = get_values(  # noqa: F821
        "NUM_MASTERMIX", "p300_mount")

    NUM_WELL_COL = 8

    if NUM_MASTERMIX == 1:
        NUM_COL_TRANSF = [12]

    elif NUM_MASTERMIX == 2:
        NUM_COL_TRANSF = [6, 6]

    elif NUM_MASTERMIX == 3:
        NUM_COL_TRANSF = [4, 4, 4]

    elif NUM_MASTERMIX == 4:
        NUM_COL_TRANSF = [3, 3, 3, 3]

    elif NUM_MASTERMIX == 6:
        NUM_COL_TRANSF = [2, 2, 2, 2, 2, 2]

    elif NUM_MASTERMIX == 12:
        NUM_COL_TRANSF = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]


    # labware
    working_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 6, 'working plate')
    reagent_stock = ctx.load_labware(mastermix_tube, 3, 'master mix')
    tiprack = ctx.load_labware('opentrons_96_tiprack_300ul', 8)
    p300 = ctx.load_instrument('p300_single_gen2', p300_mount, tip_racks=[tiprack])

    mastermix = reagent_stock.wells()[:NUM_MASTERMIX]
    cells_all = working_plate.rows()[:8][:12]

    #protocol
    ctx.comment('\n\n\n~~~~~~~~ADD MASTER MIX into CELL CULTURE~~~~~~~~\n')
    start_col = 0
    for i in range(NUM_MASTERMIX):
        columns = NUM_COL_TRANSF[i]
        end_col = start_col + columns
        for j in range(start_col, end_col):
            start = mastermix[i]
            p300.pick_up_tip()
            p300.mix(5, 100, start.bottom(z=1), rate = 3)
            p300.aspirate(20*NUM_WELL_COL, start.bottom(z=1), rate = 3)
            for k in range(NUM_WELL_COL):
                end = cells_all[k][j]
                p300.default_speed = 400
                p300.move_to(end.top(z=0))
                p300.dispense(20, end.bottom(z=2.2), rate = 0.3)
                p300.default_speed = 25
                p300.move_to(end.top(z=0))
            p300.touch_tip()
            p300.default_speed = 400
            p300.drop_tip()
        start_col = start_col + columns
