def get_values(*names):
    import json
    _all_values = json.loads("""{"p300_mount": "right"}""")
    return [_all_values[n] for n in names]


# flake8: noqa

from opentrons.types import Point

metadata = {
    'protocolName': 'Luciferase Reporter Assay for NF-kB Activation - Protocol 3: Treatment',
    'author': 'Boren Lin, Opentrons',
    'source': 'Custom Protocol Request',
    'apiLevel': '2.13'
}

TOTAL_COl = 12

MEDIUM_VOL = 120
PBS_VOL = 50
TREATMENT_VOL = 100

def run(ctx):


    [p300_mount] = get_values(  # noqa: F821
        "p300_mount")

    # labware
    working_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 6, 'working plate')
    treatment_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 5, 'treatment')
    reagent_stock = ctx.load_labware('nest_12_reservoir_15ml', 3, 'reagent stock')
    waste_res = ctx.load_labware('nest_1_reservoir_195ml', 9, 'waste')
    tiprack = [ctx.load_labware('opentrons_96_tiprack_300ul', slot)
               for slot in [8, 11, 1, 4]]
    p300 = ctx.load_instrument('p300_multi_gen2', p300_mount, tip_racks=tiprack)

    pbs = reagent_stock.wells()[0]
    treatment = treatment_plate.rows()[0][:TOTAL_COl]
    cells_all = working_plate.rows()[0][:TOTAL_COl]
    waste = waste_res.wells()[0]

    #protocol
    ctx.comment('\n\n\n~~~~~~~~REMOVE SUPERNATANT and WASH~~~~~~~~\n')

    for i in range(TOTAL_COl):
        p300.pick_up_tip()
        final = cells_all[i]
        p300.move_to(final.top(z=-0.2))
        p300.aspirate(MEDIUM_VOL*1.2, final.bottom(z=0.2).move(Point(x=-2.5)), rate = 0.2)
        p300.dispense(MEDIUM_VOL*1.2, waste.top(z=-5), rate = 3)
        p300.blow_out
        p300.drop_tip()

    p300.pick_up_tip()
    for j in range(TOTAL_COl):
        final = cells_all[j]
        p300.aspirate(PBS_VOL, pbs.bottom(z=0.5), rate = 3)
        p300.air_gap(20)
        p300.dispense(PBS_VOL+20, final.top(z=-2), rate = 0.3)
        p300.blow_out()
        p300.touch_tip()
    p300.drop_tip()

    for k in range(TOTAL_COl):
        p300.pick_up_tip()
        final = cells_all[k]
        p300.move_to(final.top(z=-0.2))
        p300.aspirate(PBS_VOL*1.5, final.bottom(z=0.2).move(Point(x=-2.5)), rate = 0.2)
        p300.dispense(PBS_VOL*1.5, waste.top(z=-5), rate = 3)
        p300.blow_out
        p300.drop_tip()

    ctx.comment('\n\n\n~~~~~~~~TREAT CELLS~~~~~~~~\n')

    for start, end in zip(treatment, cells_all):
        p300.pick_up_tip()
        p300.aspirate(TREATMENT_VOL, start.bottom(z=0.5), rate = 3)
        p300.air_gap(20)
        p300.dispense(TREATMENT_VOL+20, end.top(z=-4), rate = 0.3)
        p300.blow_out()
        p300.touch_tip()
        p300.drop_tip()
