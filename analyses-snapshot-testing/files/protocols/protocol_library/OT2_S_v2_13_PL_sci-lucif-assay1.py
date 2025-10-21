def get_values(*names):
    import json
    _all_values = json.loads("""{"p300_mount":"right"}""")
    return [_all_values[n] for n in names]


# flake8: noqa

metadata = {
    'protocolName': 'Luciferase Reporter Assay for NF-kB Activation - Protocol 1: Cell Culture Preparation',
    'author': 'Boren Lin, Opentrons',
    'source': 'Custom Protocol Request',
    'apiLevel': '2.13'
}

TOTAL_COl = 12

def run(ctx):


    [p300_mount] = get_values(  # noqa: F821
        "p300_mount")

    # labware
    working_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 6,
                                     'working plate')
    cell_stock = ctx.load_labware('nest_12_reservoir_15ml', 3, 'cell stock')
    tiprack = ctx.load_labware('opentrons_96_tiprack_300ul', 8)
    p300 = ctx.load_instrument('p300_multi_gen2', p300_mount, tip_racks=[tiprack])

    cells_source = cell_stock.wells()[0]
    cells_final = working_plate.rows()[0][:TOTAL_COl]

    # protocol
    ctx.comment('\n\n\n~~~~~~~~TRANSFER CELLS~~~~~~~~\n')
    p300.pick_up_tip()
    p300.mix(5, 200, cells_source.bottom(z=5), rate = 3)
    p300.mix(5, 200, cells_source.bottom(z=2), rate = 3)

    for i in range(TOTAL_COl):
        p300.mix(3, 200, cells_source.bottom(z=1), rate = 3)
        p300.aspirate(100, cells_source.bottom(z=0.5), rate = 0.5)
        p300.air_gap(15)
        final = cells_final[i]
        p300.dispense(115, final.top(z=-2), rate = 0.75)
        p300.blow_out()
        p300.touch_tip()

    p300.drop_tip()
