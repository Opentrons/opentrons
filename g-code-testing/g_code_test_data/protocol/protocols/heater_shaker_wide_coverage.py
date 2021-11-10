# flake8: noqa
metadata = {"apiLevel": "2.7"}


def run(ctx):
    ctx.home()
    magdeck = ctx.load_module("magneticModuleV2", 1)
    magdeck_plate = magdeck.load_labware("nest_96_wellplate_2ml_deep")

    trough = ctx.load_labware("usascientific_12_reservoir_22ml", 2)

    # Name of H/S might be changed
    heater_shaker_1 = ctx.load_module("Heater Shaker Module", 3)

    tempdeck = ctx.load_module("Temperature Module", 4)
    temp_plate = tempdeck.load_labware("opentrons_24_aluminumblock_nest_2ml_snapcap")

    tiprack_1 = ctx.load_labware_by_name("opentrons_96_tiprack_20ul", 5)

    # Name of H/S might be changed
    heater_shaker_2 = ctx.load_module("Heater Shaker Module", 6)

    thermocycler = ctx.load_module("thermocycler")
    reaction_plate = thermocycler.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")

    tiprack_2 = ctx.load_labware_by_name("opentrons_96_tiprack_1000ul", 9)

    # pipettes
    pip1 = ctx.load_instrument("p1000_single_gen2", "left", tip_racks=[tiprack_2])
    pip2 = ctx.load_instrument("p20_multi_gen2", "right", tip_racks=[tiprack_1])

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
    ctx.delay(seconds=5)
    magdeck.disengage()
    ctx.comment(f"mag status {magdeck.status}")
    magdeck.engage()
    pip1.transfer(10, trough.wells("A1"), magdeck_plate.wells("A1"))
    pip2.transfer(10, trough.wells("A1"), magdeck_plate.wells("A1"))
    magdeck.disengage()

    # Some thermocycler stuff

    # Some stuff on H/S 1
    # Some stuff at the same time on H/S 2

    # Make sure all H/S commands are run
    # Hope a breaker doesn't blow in my house from running so much at the same time
