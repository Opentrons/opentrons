def get_values(*names):
    import json
    _all_values = json.loads("""{"pipette_type":"p1000_single_gen2","pipette_mount":"left","sample_number":24,"PCR_volume":20,"bead_ratio":1.8,"elution_buffer_volume":20,"incubation_time":1,"settling_time":1,"drying_time":1}""")
    return [_all_values[n] for n in names]


import math

metadata = {
    'protocolName': 'Omega Bio-tek Mag-Bind TotalPure NGS',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    'apiLevel': '2.2'
}


def run(protocol_context):
    protocol_context.home()

    [pipette_type, pipette_mount, sample_number, PCR_volume, bead_ratio,
     elution_buffer_volume, incubation_time, settling_time,
     drying_time] = get_values(  # noqa: F821
        "pipette_type", "pipette_mount", "sample_number", "PCR_volume",
        "bead_ratio", "elution_buffer_volume", "incubation_time",
        "settling_time", "drying_time")

    mag_deck = protocol_context.load_module("magneticModuleV2", "1")
    mag_plate = mag_deck.load_labware(
        'biorad_96_wellplate_200ul_pcr')
    output_plate = protocol_context.load_labware(
        'biorad_96_wellplate_200ul_pcr', '2', 'output plate')
    total_tips = sample_number*8
    tiprack_num = math.ceil(total_tips/96)
    slots = ['3', '5', '6', '8', '9', '10', '11'][:tiprack_num]

    pip_range = pipette_type.split('_')[0]
    if pip_range == 'p1000':
        tip_name = 'opentrons_96_tiprack_1000ul'
    elif pip_range == 'p300' or range == 'p50':
        tip_name = 'opentrons_96_tiprack_300ul'
    elif pip_range == 'p20':
        tip_name = 'opentrons_96_tiprack_20ul'
    else:
        tip_name = 'opentrons_96_tiprack_10ul'

    tipracks = [
        protocol_context.load_labware(tip_name, slot, pip_range + ' tiprack')
        for slot in slots
    ]
    pipette = protocol_context.load_instrument(
        pipette_type, pipette_mount, tip_racks=tipracks)

    mode = pipette_type.split('_')[1]
    if mode == 'single':
        if sample_number <= 5:
            reagent_container = protocol_context.load_labware(
                'opentrons_24_tuberack_generic_2ml_screwcap',
                '7',
                'reagent rack'
            )
            liquid_waste = protocol_context.load_labware(
                'usascientific_12_reservoir_22ml',
                '5',
                'reservoir for waste').wells()[-1]

        else:
            reagent_container = protocol_context.load_labware(
                'usascientific_12_reservoir_22ml', '7', 'reagent reservoir')
            liquid_waste = reagent_container.wells()[-1]
        samples = [well for well in mag_plate.wells()[:sample_number]]
        samples_top = [well.top() for well in samples]
        output = [well for well in output_plate.wells()[:sample_number]]

    else:
        reagent_container = protocol_context.load_labware(
            'usascientific_12_reservoir_22ml', '7', 'reagent reservoir')
        liquid_waste = reagent_container.wells()[-1]
        col_num = math.ceil(sample_number/8)
        samples = [col for col in mag_plate.rows()[0][:col_num]]
        samples_top = [well.top() for well in mag_plate.rows()[0][:col_num]]
        output = [col for col in output_plate.rows()[0][:col_num]]

    # Define reagents and liquid waste
    beads = reagent_container.wells()[0]
    ethanol = reagent_container.wells()[1]
    elution_buffer = reagent_container.wells()[2]

    # Define bead and mix volume to resuspend beads
    bead_volume = PCR_volume*bead_ratio
    if mode == 'single':
        if bead_volume*sample_number > pipette.max_volume:
            mix_vol = pipette.max_volume
        else:
            mix_vol = bead_volume*sample_number
    else:
        if bead_volume*col_num > pipette.max_volume:
            mix_vol = pipette.max_volume
        else:
            mix_vol = bead_volume*col_num
    total_vol = bead_volume + PCR_volume + 15
    mix_voltarget = PCR_volume + 10

    # Disengage MagDeck
    mag_deck.disengage()

    # Mix beads and PCR samples
    for target in samples:
        pipette.flow_rate.aspirate = 180
        pipette.flow_rate.dispense = 180
        pipette.pick_up_tip()
        # Slow down head speed 0.5X for bead handling
        pipette.mix(25, mix_vol, beads)
        protocol_context.default_speed = 200
        pipette.flow_rate.aspirate = 10
        pipette.flow_rate.dispense = 10
        pipette.transfer(
            bead_volume, beads, target, new_tip='never')
        pipette.flow_rate.aspirate = 50
        pipette.flow_rate.dispense = 50
        pipette.mix(40, mix_voltarget, target)
        pipette.blow_out()
        protocol_context.default_speed = 400

        pipette.drop_tip()

    # Incubate beads and PCR product at RT for 5 minutes
    protocol_context.comment("Incubating the beads and PCR products at room \
temperature for 5 minutes. Protocol will resume automatically.")
    protocol_context.delay(seconds=incubation_time)

    # Engage MagDeck and Magnetize
    mag_deck.engage()
    protocol_context.comment("Delaying for "+str(settling_time)+" seconds for \
beads to settle.")
    protocol_context.delay(seconds=settling_time)

    # Remove supernatant from magnetic beads
    pipette.flow_rate.aspirate = 25
    pipette.flow_rate.dispense = 120
    for target in samples:
        pipette.transfer(
            total_vol, target, liquid_waste.top(), blow_out=True)

    # Wash beads twice with 70% ethanol
    air_vol = pipette.max_volume*0.1

    for _ in range(2):
        pipette.pick_up_tip()
        for target in samples_top:
            pipette.transfer(
                185, ethanol, target, air_gap=air_vol, new_tip='never')
        msg = "Delaying for 17 seconds."
        protocol_context.delay(seconds=1, msg=msg)
        for target in samples:
            if not pipette.hw_pipette['has_tip']:
                pipette.pick_up_tip()
            pipette.transfer(195, target.bottom(z=0.7), liquid_waste.top(),
                             air_gap=air_vol, new_tip='never')
            pipette.drop_tip()

    # Dry at RT
    msg = "Drying the beads for " + str(drying_time) + " minutes. Protocol \
will resume automatically."
    protocol_context.delay(seconds=drying_time, msg=msg)

    # Disengage MagDeck
    mag_deck.disengage()

    # Mix beads with elution buffer
    if elution_buffer_volume/2 > pipette.max_volume:
        mix_vol = pipette.max_volume
    else:
        mix_vol = elution_buffer_volume/2
    for target in samples:
        pipette.transfer(
            elution_buffer_volume,
            elution_buffer,
            target,
            mix_after=(45, mix_vol)
        )

    # Incubate at RT for 3 minutes
    protocol_context.comment("Incubating at room temperature for 3 minutes. \
Protocol will resume automatically.")
    protocol_context.delay(seconds=1)

    # Engage MagDeck for 1 minute and remain engaged for DNA elution
    mag_deck.engage()
    protocol_context.comment("Delaying for "+str(settling_time)+" seconds for \
beads to settle.")
    protocol_context.delay(seconds=settling_time)

    # Transfer clean PCR product to a new well
    for target, dest in zip(samples, output):
        pipette.transfer(elution_buffer_volume, target.bottom(z=1), dest.top(),
                         blow_out=True)

    # Disengage MagDeck
    mag_deck.disengage()