def get_values(*names):
    import json
    _all_values = json.loads("""{"p300_mount": "right"}""")
    return [_all_values[n] for n in names]


# flake8: noqa
from opentrons.types import Point

metadata = {
    'protocolName': 'Luciferase Reporter Assay for NF-kB Activation - Protocol 4: Luciferase Activity Measurement',
    'author': 'Boren Lin, Opentrons',
    'source': 'Custom Protocol Request',
    'apiLevel': '2.13'
}



def run(ctx):

    [p300_mount] = get_values(  # noqa: F821
        "p300_mount")

    TOTAL_COl = 12

    MEDIUM_VOL = 100
    PBS_VOL = 50
    LYSIS_VOL = 30
    LUC_VOL = 100

    # labware
    working_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 6, 'working plate')
    reagent_stock = ctx.load_labware('nest_12_reservoir_15ml', 3, 'reagent stock')
    waste_res = ctx.load_labware('nest_1_reservoir_195ml', 9, 'waste')
    tiprack = [ctx.load_labware('opentrons_96_tiprack_300ul', slot)
               for slot in [8, 11, 1, 4]]
    p300 = ctx.load_instrument('p300_multi_gen2', p300_mount, tip_racks=tiprack)

    pbs = reagent_stock.wells()[0]
    lysis = reagent_stock.wells()[1]
    luciferase = reagent_stock.wells()[2]

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

    ctx.comment('\n\n\n~~~~~~~~ADD LYSIS BUFFER~~~~~~~~\n')

    p300.pick_up_tip()
    for l in range(TOTAL_COl):
        final = cells_all[l]
        p300.aspirate(LYSIS_VOL, lysis.bottom(z=0.5), rate = 0.5)
        ctx.delay(seconds=2)
        p300.dispense(LYSIS_VOL, final.bottom(z=5), rate = 0.3)
        ctx.delay(seconds=2)
        p300.touch_tip()
    p300.drop_tip()

    ctx.delay(minutes=3)

    ctx.comment('\n\n\n~~~~~~~~ADD LUCIFERASE ASSAY REAGENT~~~~~~~~\n')

    for m in range(TOTAL_COl):
        p300.pick_up_tip()
        final = cells_all[m]
        p300.aspirate(LUC_VOL, luciferase.bottom(z=0.5), rate = 0.75)
        ctx.delay(seconds=2)
        p300.air_gap(20)
        p300.dispense(LUC_VOL+20, final.top(z=-0.5), rate = 0.75)
        p300.mix(3, 75, final.bottom(z=0.5), rate = 3)

        p300.touch_tip()
        p300.drop_tip()
