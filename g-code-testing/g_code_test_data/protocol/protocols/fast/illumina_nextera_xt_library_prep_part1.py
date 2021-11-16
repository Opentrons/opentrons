def get_values(*names):
    import json
    _all_values = json.loads("""{"m20_mount":"left","p20_mount":"right","number_of_samples":96}""")
    return [_all_values[n] for n in names]


import math

metadata = {
    'protocolName': 'Illumina Nextera XT NGS Prep 1: Tagment Genomic DNA & \
Amplify Libraries',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    'apiLevel': '2.2'
    }


def run(protocol_context):

    protocol_context.home()

    [p20_mount, m20_mount, number_of_samples] = get_values(  # noqa: F821
        'p20_mount', 'm20_mount', 'number_of_samples')

    # labware setup
    gDNA_plate = protocol_context.load_labware(
        'biorad_96_wellplate_200ul_pcr', '1', 'gDNA plate')
    out_plate = protocol_context.load_labware(
        'biorad_96_wellplate_200ul_pcr', '2', 'output plate')
    index_plate = protocol_context.load_labware(
        'biorad_96_wellplate_200ul_pcr', '4', 'index plate')
    tuberack = protocol_context.load_labware(
        'opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap', '5',
        'reagent rack')
    tiprack_single = [
        protocol_context.load_labware('opentrons_96_tiprack_20ul', slot)
        for slot in ['3', '6', '7', '8']]
    tiprack_multi = [
        protocol_context.load_labware('opentrons_96_tiprack_20ul', slot)
        for slot in ['9', '10']]

    # reagent setup
    num_cols = math.ceil(number_of_samples/8)

    atm = tuberack.wells()[0]  # Amplicon Tagment Mix
    td = tuberack.wells()[1]  # Tagment DNA Buffer
    nt = tuberack.wells()[2]  # Neutralize Tagment Buffer
    npm = tuberack.wells()[3]  # Nextera PCR Master Mix
    indexes = index_plate.rows()[0][:num_cols]

    # pipette setup
    p20 = protocol_context.load_instrument(
        'p20_single_gen2', p20_mount, tip_racks=tiprack_single)
    m20 = protocol_context.load_instrument(
        'p20_multi_gen2', m20_mount, tip_racks=tiprack_multi)

    # define sample locations
    samples_multi = gDNA_plate.rows()[0][:num_cols]
    output_single = out_plate.wells()[:number_of_samples]
    output_multi = out_plate.rows()[0][:num_cols]

    """
    Tagment genomic DNA
    """
    # Add Tagment DNA Buffer to each well
    p20.transfer(10, td, output_single, blow_out=True)

    # Add normalized gDNA to each well
    m20.transfer(5, samples_multi, output_multi, new_tip='always')

    # Add ATM to each well
    p20.transfer(5, atm, output_single, mix_after=(5, 10), new_tip='always')

    # protocol_context.pause(
    #     "Centrifuge at 280 × g at 20°C for 1 minute. Place on the preprogrammed "
    #     "thermalcycler and run the tagmentation program. When the sample reaches 10°C"
    #     ", immediately proceed to the next step because the transposome is still "
    #     "active. Place the plate back to slot 2."
    # )

    # Add Neutralize Tagment Buffer to each well
    p20.transfer(5, nt, output_single, mix_after=(5, 10), new_tip='always')

    # protocol_context.pause(
    #     "Centrifuge at 280 × g at 20°C for 1 minute. Place the plate back on slot 2."
    # )

    # Incubate at RT for 5 minutes
    protocol_context.delay(seconds=1)

    """
    Amplify Libraries
    """
    # Add each index
    m20.transfer(
        10, indexes, output_multi, mix_after=(5, 10), new_tip='always')

    # Add Nextera PCR Master Mix to each well
    p20.transfer(15, npm, output_single, mix_after=(2, 10))