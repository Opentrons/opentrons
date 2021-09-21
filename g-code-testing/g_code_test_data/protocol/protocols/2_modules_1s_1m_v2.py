# flake8: noqa
metadata = {"apiLevel": "2.7"}


def run(ctx):
    ctx.home()
    trough = ctx.load_labware("usascientific_12_reservoir_22ml", 2)
    tiprack = ctx.load_labware_by_name("opentrons_96_tiprack_20ul", 3)
    tiprack1 = ctx.load_labware_by_name("opentrons_96_tiprack_300ul", 6)

    magdeck = ctx.load_module("magneticModuleV2", 1)
    magdeck_plate = magdeck.load_labware("nest_96_wellplate_2ml_deep")

    tempdeck = ctx.load_module("Temperature Module", 4)
    temp_plate = tempdeck.load_labware("opentrons_24_aluminumblock_nest_2ml_snapcap")

    # pipettes
    pip1 = ctx.load_instrument("p300_single_gen2", "left", tip_racks=[tiprack1])
    pip2 = ctx.load_instrument("p20_multi_gen2", "right", tip_racks=[tiprack])

    # Temperature Module Testing
    tempdeck.set_temperature(20)
    ctx.comment(f"temp target {tempdeck.target}")
    ctx.comment(f"temp current {tempdeck.temperature}")
    # ctx.comment(f"temp status {tempdeck.status}")

    tempdeck.set_temperature(30)
    ctx.comment(f"temp target {tempdeck.target}")
    ctx.comment(f"temp current {tempdeck.temperature}")
    pip2.transfer(10, trough.wells("A1"), temp_plate.wells("A1"))

    # Magnetic Module Testing
    magdeck.engage(height=10)
    ctx.delay(seconds=30)
    magdeck.disengage()
    ctx.comment(f"mag status {magdeck.status}")
    magdeck.engage()
    pip1.transfer(10, trough.wells("A1"), magdeck_plate.wells("A1"))
    pip2.transfer(10, trough.wells("A1"), magdeck_plate.wells("A1"))
    magdeck.disengage()

    # #run time = 6 minutes 1 second
