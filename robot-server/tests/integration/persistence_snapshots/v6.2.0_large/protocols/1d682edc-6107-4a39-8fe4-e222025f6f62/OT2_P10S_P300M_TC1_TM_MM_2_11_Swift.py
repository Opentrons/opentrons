# Opentrons Labworks
# APIV2

metadata = {"apiLevel": "2.11"}


def run(protocol_context):
    # Labware Setup
    rt_reagents = protocol_context.load_labware("nest_12_reservoir_15ml", "2")

    p300rack = protocol_context.load_labware("opentrons_96_tiprack_300ul", "3")

    p20racks = [
        protocol_context.load_labware("opentrons_96_tiprack_20ul", slot)
        for slot in [
            "5",
            "6",
        ]
    ]
    # Pipette Setup
    p20 = protocol_context.load_instrument("p10_single", "left", tip_racks=p20racks)
    p300 = protocol_context.load_instrument(
        "p300_multi_gen2", "right", tip_racks=[p300rack]
    )

    # Module Setup
    magdeck = protocol_context.load_module("magneticModuleV2", "1")
    mag_plate = magdeck.load_labware("nest_96_wellplate_2ml_deep")

    tempdeck = protocol_context.load_module("Temperature Module", "4")
    cool_reagents = tempdeck.load_labware(
        "opentrons_24_aluminumblock_generic_2ml_screwcap"
    )

    thermocycler = protocol_context.load_module("thermocycler")
    reaction_plate = thermocycler.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")

    # Reagent Setup
    enzymatic_prep_mm = cool_reagents.wells_by_name()["A1"]
    ligation_mm = cool_reagents.wells_by_name()["A2"]
    pcr_mm = cool_reagents.wells_by_name()["A3"]
    beads = rt_reagents.wells_by_name()["A2"]
    ethanol = rt_reagents.wells_by_name()["A3"]
    te = rt_reagents.wells_by_name()["A4"]
    waste = rt_reagents.wells_by_name()["A12"]

    # number of samples
    sample_num = 8

    # Destination of input DNA samples and samples on the magnetic module
    tc_samples = reaction_plate.columns_by_name()
    enzymatic_prep_samples = tc_samples["2"]
    pcr_prep_samples = tc_samples["3"]
    purified_samples = tc_samples["4"]

    # mag_samples = mag_plate.wells()[:sample_num]
    mag_column = mag_plate.columns_by_name()
    mag_samples = mag_column["2"]

    p20.flow_rate.aspirate = 150
    p20.flow_rate.dispense = 300

    # Actively cool the samples and enzymes
    tempdeck.set_temperature(40)
    thermocycler.set_block_temperature(30)

    # #Make sure to vortex mastermix right before the run - Dispense Enzymatic Prep Master Mix to the samples
    for well in enzymatic_prep_samples:  #
        p20.pick_up_tip()
        p20.aspirate(10, enzymatic_prep_mm.bottom(0.2))
        p20.dispense(10, well.bottom())
        p20.blow_out()
        p20.mix(2, 10, well.top(-13.5))
        p20.move_to(well.top(-12))
        protocol_context.delay(seconds=0.5)
        p20.blow_out()
        p20.drop_tip()

    # Run Enzymatic Prep Profile
    thermocycler.close_lid()
    thermocycler.set_block_temperature(70)
    thermocycler.set_block_temperature(32, hold_time_minutes=1)
    thermocycler.set_block_temperature(64.5, hold_time_minutes=1)
    thermocycler.set_block_temperature(4)
    thermocycler.deactivate_lid()
    thermocycler.open_lid()

    # Transfer Ligation Master Mix to the samples

    # p20.pick_up_tip()
    # p20.mix(3, 20, ligation_mm)
    # p20.drop_tip()
    # p20.home()

    # repeat step
    # for well in enzymatic_prep_samples:
    #     p20.pick_up_tip()
    #     p20.aspirate(18, ligation_mm)
    #     p20.dispense(18, well.bottom())
    #     p20.blow_out()
    #     p20.drop_tip()
    #     p20.pick_up_tip()
    #     p20.aspirate(12, ligation_mm)
    #     p20.dispense(12, well.bottom())
    #     p20.mix(2, 15, well.top(-13.5))
    #     p20.blow_out(well.top(-7))
    #     p20.drop_tip()

    # thermocycler.set_block_temperature(20.2, hold_time_minutes=2)
    # thermocycler.set_block_temperature(4)

    """Ligation Purification"""
    p300.home()
    # Transfer samples to the Magnetic Module
    p300.flow_rate.aspirate = 10
    p300.pick_up_tip()
    p300.aspirate(20, enzymatic_prep_samples[0])
    p300.dispense(20, mag_samples[0].top(-4))
    p300.blow_out(mag_samples[0].top(-4))
    p300.drop_tip()

    # Transfer beads to the samples on the MagDeck

    p300.pick_up_tip()
    # Slow down flow rates to aspirate the beads
    p300.flow_rate.aspirate = 75
    p300.flow_rate.dispense = 75
    p300.mix(2, 20, beads)
    p300.flow_rate.aspirate = 10
    p300.flow_rate.dispense = 10
    p300.aspirate(20, beads)
    p300.default_speed = 50
    p300.move_to(mag_samples[0].top(-2))
    p300.default_speed = 400
    p300.dispense(20, mag_samples[0].top(-5))
    p300.blow_out()
    # Speed up flow rates for mix steps
    p300.flow_rate.aspirate = 50
    p300.flow_rate.dispense = 50
    p300.mix(2, 20, mag_samples[0].bottom())
    p300.blow_out(mag_samples[0].top(-5))
    # p300.touch_tip(v_offset=-2)
    p300.drop_tip()

    # Incubate for 5 minutes
    # protocol_context.delay(minutes=1)

    # Place samples on the magnets
    magdeck.engage()
    # 17 minutes
    # protocol_context.delay(minutes=2)

    # # Remove supernatant
    # p300.flow_rate.aspirate = 20
    # p300.flow_rate.dispense = 50

    # p300.pick_up_tip()
    # p300.aspirate(108, mag_samples[0].bottom(2))
    # p300.dispense(108, waste.bottom(1.5))
    # p300.air_gap(10)
    # p300.drop_tip()

    # Wash samples 2X with 180 uL of 80% EtOHt
    p300.default_speed = 200
    p300.flow_rate.aspirate = 75
    p300.flow_rate.dispense = 50

    # ethanol wash1
    p300.pick_up_tip()
    p300.aspirate(18, ethanol)
    # p300.air_gap(10)
    p300.dispense(20, mag_samples[0].top(-2))
    # p300.air_gap(10)
    protocol_context.delay(seconds=30)
    p300.aspirate(19, mag_samples[0])
    # p300.air_gap(5)
    p300.dispense(20, waste.bottom(1.5))
    # p300.air_gap(10)
    p300.drop_tip()

    # #ethanol wash2, repeat step
    # p300.pick_up_tip()
    # p300.aspirate(180, ethanol)
    # p300.air_gap(5)
    # p300.dispense(210, mag_samples[0].top(-2))
    # p300.air_gap(10)
    # protocol_context.delay(seconds=30)
    # p300.aspirate(190, mag_samples[0])
    # p300.air_gap(5)
    # p300.dispense(210, waste.bottom(1.5))
    # p300.air_gap(10)
    # p300.drop_tip()

    p300.pick_up_tip()
    p300.aspirate(20, mag_samples[0].bottom(-0.25))
    # p300.air_gap(5)
    p300.drop_tip()

    protocol_context.delay(seconds=30)
    # Remove samples from the magnets
    magdeck.disengage()

    # Elute clean ligation product
    # p300.pick_up_tip()
    # p300.aspirate(22, te)
    # p300.dispense(22, mag_samples[0].top(-12))
    # p300.blow_out(mag_samples[0].top())
    # p300.flow_rate.aspirate = 100
    # p300.flow_rate.dispense = 200
    # p300.mix(10, 20, mag_samples[0].top(-13.5))
    # p300.flow_rate.aspirate = 75
    # p300.flow_rate.dispense = 50
    # p300.blow_out(mag_samples[0].top())
    # p300.drop_tip()

    # # Incubate for 1 minute
    # protocol_context.delay(minutes=2)

    # Place samples on the magnets
    magdeck.engage()
    # protocol_context.delay(minutes=2)

    # Transfer clean samples to aluminum block plate, new column/8-well strip
    #   The clean ligation product will be transfered to column 2 of the PCR
    #   strips on the aluminum block
    p300.flow_rate.aspirate = 10
    p300.pick_up_tip()
    p300.aspirate(20, mag_samples[0].bottom(0.25))
    p300.dispense(20, pcr_prep_samples[0])
    p300.blow_out(pcr_prep_samples[0].top())
    p300.drop_tip()

    # Disengage MagDeck for PCR purification protocol
    magdeck.disengage()

    """PCR Prep"""
    # Transfer Dual Indexes to the sample
    # Primer screw tubes are shallow !!!!
    primers = list(cool_reagents.wells("B1", "B2", "B3", "B4", "B5", "B6", "C1", "C2"))[
        :sample_num
    ]
    for primer, well in zip(primers, pcr_prep_samples):
        p20.pick_up_tip()
        p20.aspirate(5, primer.top(-25))
        p20.dispense(5, well)
        p20.blow_out()
        p20.drop_tip()

    # Transfer PCR Master Mix to the samples

    p20.pick_up_tip()
    p20.mix(2, 10, pcr_mm)
    p20.drop_tip()

    for well in pcr_prep_samples:
        p20.pick_up_tip()
        p20.aspirate(8, pcr_mm)
        p20.dispense(8, well.bottom())
        p20.blow_out()
        p20.drop_tip()
        p20.pick_up_tip()
        p20.aspirate(7, pcr_mm)
        p20.dispense(7, well.bottom())
        p20.mix(2, 8, well.top(-13.5))
        p20.blow_out(well.top(-12))
        p20.drop_tip()

    COVER_TEMP = 105
    PLATE_TEMP_PRE = 4
    PLATE_TEMP_HOLD_1 = (97, 5)  # 30)
    PLATE_TEMP_HOLD_2 = (97, 5)  # 10)
    PLATE_TEMP_HOLD_3 = (59.5, 5)  # 30)
    PLATE_TEMP_HOLD_4 = (67.3, 5)  # 30)
    # PLATE_TEMP_HOLD_5 = (72, 300)
    PLATE_TEMP_POST = 4
    NUM_CYCLES = 5
    CYCLED_STEPS = [
        {
            "temperature": PLATE_TEMP_HOLD_2[0],
            "hold_time_seconds": PLATE_TEMP_HOLD_2[1],
        },
        {
            "temperature": PLATE_TEMP_HOLD_3[0],
            "hold_time_seconds": PLATE_TEMP_HOLD_3[1],
        },
        {
            "temperature": PLATE_TEMP_HOLD_4[0],
            "hold_time_seconds": PLATE_TEMP_HOLD_4[1],
        },
    ]

    # Set PRE temp
    thermocycler.set_block_temperature(PLATE_TEMP_PRE)
    # Set LID temp
    thermocycler.set_lid_temperature(105)
    thermocycler.close_lid()
    # Set HOLD1 temp
    thermocycler.set_block_temperature(
        PLATE_TEMP_HOLD_1[0], hold_time_seconds=PLATE_TEMP_HOLD_1[1]
    )
    # Loop HOLD2 - HOLD4 temps NUM_CYCLES times
    thermocycler.execute_profile(steps=CYCLED_STEPS, repetitions=NUM_CYCLES)
    # Set POST temp
    # thermocycler.set_block_temperature(PLATE_TEMP_POST)
    thermocycler.open_lid()

    # PCR purification
    mag_samples = mag_column["3"]

    # Transfer samples to the Magnetic Module
    p300.flow_rate.aspirate = 10
    p300.pick_up_tip()
    p300.aspirate(20, pcr_prep_samples[0])
    p300.dispense(20, mag_samples[0].top(-4))
    p300.blow_out(mag_samples[0].top(-4))
    p300.drop_tip()

    # Transfer beads to the samples in PCR strip

    # p300.pick_up_tip()
    # p300.flow_rate.aspirate = 75
    # p300.flow_rate.dispense = 75
    # p300.mix(2, 60, beads)
    # # Slow down speed to aspirate the beads
    # p300.flow_rate.aspirate = 10
    # p300.flow_rate.dispense = 10
    # p300.aspirate(32.5, beads)
    # # Slow down the head speed for bead handling
    # p300.default_speed = 50
    # p300.move_to(mag_samples[0].top(-2))
    # # Set the robot speed back to the default
    # p300.default_speed = 400
    # # Dispense beads to the samples
    # p300.dispense(32.5, mag_samples[0].top(-12))
    # p300.flow_rate.aspirate = 50
    # p300.flow_rate.dispense = 50
    # p300.blow_out()
    # p300.mix(2, 60, mag_samples[0].top(-13.5))
    # p300.move_to(mag_samples[0].top(-12))
    # p300.blow_out()
    # p300.drop_tip()

    # Incubate for 1 minute
    # protocol_context.delay(minutes=2)

    # # Transfer samples to the PCR plate on the Magnetic Module
    # # Place samples on the magnets
    # magdeck.engage()
    # protocol_context.delay(minutes=2)

    # # Aspirate supernatant

    # p300.pick_up_tip()
    # p300.flow_rate.dispense = 50

    # p300.aspirate(82.5, mag_samples[0].bottom(2))
    # p300.dispense(82.5, waste)
    # p300.blow_out()
    # p300.drop_tip()

    # # Wash samples 2X with 180 uL of 80% EtOH
    # #1st ethanol wash
    # p300.pick_up_tip()
    # p300.aspirate(180, ethanol)
    # p300.air_gap(5)
    # p300.dispense(180, mag_samples[0].top(-2))
    # p300.blow_out()
    # p300.air_gap(5)
    # #p300.drop_tip()
    # protocol_context.delay(seconds=30)
    # #p300.pick_up_tip()
    # p300.aspirate(190, mag_samples[0])
    # p300.air_gap(5)
    # p300.dispense(190, waste)
    # p300.blow_out()
    # p300.air_gap(10)
    # p300.drop_tip()

    # # #2nd ethanol wash
    # p300.pick_up_tip()
    # p300.aspirate(180, ethanol)
    # p300.air_gap(5)
    # p300.dispense(180, mag_samples[0].top(-2))
    # p300.blow_out()
    # p300.air_gap(5)
    # #p300.drop_tip()
    # protocol_context.delay(seconds=30)
    # #p300.pick_up_tip()
    # p300.aspirate(190, mag_samples[0])
    # p300.air_gap(5)
    # p300.dispense(190, waste)
    # p300.blow_out()
    # p300.air_gap(10)
    # # p300.drop_tip()
    # # #use p300m to remove residual 80% etoh
    # # p300.pick_up_tip()
    # # p300.aspirate(30, mag_samples[0])

    # p300.air_gap(5)
    # p300.drop_tip()

    # protocol_context.delay(minutes=1)
    # #Elute clean product
    # # magdeck.disengage()

    # # p300.pick_up_tip()
    # # p300.aspirate(22, te)
    # p300.dispense(22, mag_samples[0].top(-12))
    # p300.blow_out(mag_samples[0].top())
    # p300.mix(10, 20, mag_samples[0].top(-13.5))
    # p300.blow_out(mag_samples[0].top())
    # p300.drop_tip()

    # # Incubate for 1 minute
    # protocol_context.delay(minutes=2)

    # # Place samples on the magnets
    # magdeck.engage()
    # protocol_context.delay(minutes=2)

    # # Transfer clean samples to aluminum block plate, new column/8-well strip
    # # The clean ligation product will be transfered to column 3 of the PCR
    # # plate on the thermocycler

    # p300.pick_up_tip()
    # p300.aspirate(22, mag_samples[0])
    # p300.dispense(22, purified_samples[0].top(-12))
    # p300.blow_out()
    # p300.drop_tip()

    # Collect clean product from column 3 of the aluminum block in slot  3
    # Disengage MagDeck for PCR purification protocol
    tempdeck.deactivate()
    magdeck.disengage()


# run time = 36 minutes
