"""DETAILS."""

metadata = {
    'protocolName': 'Customizable Serial Dilution',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.19"
}
def add_parameters(parameters):

    get_choices_deck_slots = lambda: [{"display_name": str(i), "value": i } for i in [f"{chr(ord('A') + i)}{j}" for i in range(4) for j in range(1, 5)]]

    parameters.add_str(
        variable_name = "pipette_type", display_name = "Pipette Type", default = "flex_1channel_1000", choices = [
            {"display_name": "Flex P1000 8-Channel Pipette", "value": "flex_8channel_1000"},
            {"display_name": "Flex P50 8-Channel Pipette", "value": "flex_8channel_50"},
            {"display_name": "Flex P1000 1-Channel Pipette", "value": "flex_1channel_1000"},
            {"display_name": "Flex P50 1-Channel Pipette", "value": "flex_1channel_50"} ]
    )
    parameters.add_str(
        variable_name = "mount_side", display_name = "Mount Side", default = "right", choices = [
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"}
        ]
    )
    parameters.add_str(
        variable_name = "tip_type", display_name = "Tip Type", default = "1000f", choices = [
            {"display_name": "Opentrons 1000 uL Filter", "value": "1000f"},
            {"display_name": "Opentrons 1000 uL Standard", "value": "1000"},
            {"display_name": "Opentrons 200 uL Filter", "value": "200f"},
            {"display_name": "Opentrons 200 uL Standard", "value": "200"},
            {"display_name": "Opentrons 50 uL Filter", "value": "50f"},
            {"display_name": "Opentrons 50 uL Standard", "value": "50"}
        ]
    )

    parameters.add_str(
        variable_name = "tip_1_slot", display_name = "Tiprack 1 Deck Slot", default = "C1", choices = get_choices_deck_slots()
    )

    parameters.add_str(
        variable_name = "tip_2_slot", display_name = "Tiprack 2 Deck Slot", default = "D1", choices = get_choices_deck_slots()
    )
    parameters.add_str(
        variable_name = "trough_type", display_name = "Trough Type", default = "nest_12_reservoir_15ml", choices = [
            {"display_name": "NEST 12-Well, 15mL", "value": "nest_12_reservoir_15ml"},
            {"display_name": "USA Scientific 12-Well, 22mL", "value": "usascientific_12_reservoir_22ml"}
        ]
    )

    parameters.add_str(
        variable_name = "trough_slot", display_name = "Trough Deck Slot", default = "D2", choices = get_choices_deck_slots()
    )

    parameters.add_str(
        variable_name = "plate_type", display_name = "Plate Type", default = "nest_96_wellplate_200ul_flat", choices = [
            {"display_name": "NEST 96-Well, 200uL Flat", "value": "nest_96_wellplate_200ul_flat"},
            {"display_name": "Corning 96-Well, 360uL Flat", "value": "corning_96_wellplate_360ul_flat"},
            {"display_name": "NEST 96-Well, 100uL PCR", "value": "nest_96_wellplate_100ul_pcr_full_skirt"},
            {"display_name": "Bio-Rad 96-Well, 200uL PCR", "value": "biorad_96_wellplate_200ul_pcr"}
        ]
    )

    parameters.add_str(
        variable_name = "plate_slot", display_name = "Plate Deck Slot", default = "D3", choices = get_choices_deck_slots()
    )

    parameters.add_int(
        variable_name = "dilution_factor", display_name = "dilution factor", default = 3, minimum = 1, maximum = 3
    )
    parameters.add_int(
        variable_name = "num_of_dilutions", display_name = "number of dilutions", default = 10, minimum = 1, maximum = 11
    )
    parameters.add_float(
        variable_name = "total_mixing_volume", display_name = "total mixing volume (in uL)", default = 150, minimum = 15, maximum = 150
    )
    parameters.add_bool(
        variable_name = "blank_on", display_name = "Blank in Well Plate", default = False
    )
    parameters.add_str(
        variable_name = "tip_use_strategy", display_name = "tip use strategy", default = "never", choices = [
            {"display_name": "use one tip", "value": "never"},
            {"display_name": "change tips", "value": "always"}
        ]
    )

    parameters.add_str(
        variable_name = "waste_type", display_name = "Waste Container Type", default = "trash_bin", choices = [
            {"display_name": "trash bin", "value": "trash_bin"},
            {"display_name": "waste chute", "value": "waste_chute"}
        ]
    )
    parameters.add_int(
        variable_name = "air_gap_volume", display_name = "volume of air gap", default = 10, minimum = 0, maximum = 10
    )

def run(protocol_context):
    global pipette_type
    pipette_type = protocol_context.params.pipette_type
    global mount_side
    mount_side = protocol_context.params.mount_side
    global tip_type
    tip_type = protocol_context.params.tip_type
    
    global tip_1_slot
    tip_1_slot = protocol_context.params.tip_1_slot
    global tip_2_slot
    tip_2_slot = protocol_context.params.tip_2_slot

    global trough_type
    trough_type = protocol_context.params.trough_type
    global trough_slot
    trough_slot = protocol_context.params.trough_slot

    global plate_type
    plate_type = protocol_context.params.plate_type
    global plate_slot
    plate_slot = protocol_context.params.plate_slot
    global waste_type
    waste_type = protocol_context.params.waste_type
    global dilution_factor
    dilution_factor = protocol_context.params.dilution_factor
    global num_of_dilutions
    num_of_dilutions = protocol_context.params.num_of_dilutions
    global total_mixing_volume
    total_mixing_volume = protocol_context.params.total_mixing_volume
    global blank_on
    blank_on = protocol_context.params.blank_on
    global tip_use_strategy
    tip_use_strategy = protocol_context.params.tip_use_strategy
    global air_gap_volume
    air_gap_volume = protocol_context.params.air_gap_volume


    # check for bad setup here
    if not 1 <= num_of_dilutions <= 11:
        raise Exception('Enter a number of dilutions between 1 and 11')

    if num_of_dilutions == 11 and blank_on == 1:
        raise Exception(
                        'No room for blank with 11 dilutions')

    tip_types_dict = {
        '50f': 'opentrons_flex_96_filtertiprack_50ul',
        '50': 'opentrons_flex_96_tiprack_50ul',
        '200f': 'opentrons_flex_96_filtertiprack_200ul',
        '200': 'opentrons_flex_96_tiprack_200ul',
        '1000f': 'opentrons_flex_96_filtertiprack_1000ul',
        '1000': 'opentrons_flex_96_tiprack_1000ul',
    }

    # labware
    trough = protocol_context.load_labware(
        trough_type, trough_slot)
    plate = protocol_context.load_labware(
        plate_type, plate_slot)
    tip_name = tip_types_dict[tip_type]
    tipracks = [
        protocol_context.load_labware(tip_name, slot)
        for slot in [tip_1_slot, tip_2_slot]
    ]

    # pipette
    pipette = protocol_context.load_instrument(
        pipette_type, mount_side, tipracks)
    pip_channel = float(pipette_type.split('_')[1][0])

    # trash
    if waste_type == "trash_bin":
        trash = protocol_context.load_trash_bin("A3")
    else:
        trash = protocol_context.load_waste_chute()
    
    # reagents
    diluent = trough.wells()[0]
    source = plate.columns()[0]

    # define liquids (dilutent + original samples)
    dilutent_liquid = protocol_context.define_liquid(
        name="Dilutent",
        description="Diluent liquid is filled in the reservoir",
        display_color="#33FF33"
        )
    sample_liquid = protocol_context.define_liquid(
        name="Sample",
        description="Non-diluted samples are loaded in the 1st column",
        display_color="#FF0000"
        )
    # load dilutent
    diluent.load_liquid(liquid=dilutent_liquid, volume=0.8 * diluent.max_volume)
    # load sample
    for well in source:
        well.load_liquid(liquid=sample_liquid, volume=total_mixing_volume)

    transfer_volume = total_mixing_volume/dilution_factor
    diluent_volume = total_mixing_volume - transfer_volume

    if pip_channel == 8:
        dilution_destination_sets = [
            [row] for row in plate.rows()[0][1:num_of_dilutions+1]]
        dilution_source_sets = [
            [row] for row in plate.rows()[0][:num_of_dilutions]]
        blank_set = [plate.rows()[0][num_of_dilutions+1]]
    else:
        dilution_destination_sets = plate.columns()[1:num_of_dilutions+1]
        dilution_source_sets = plate.columns()[:num_of_dilutions]
        blank_set = plate.columns()[num_of_dilutions+1]
    all_diluent_destinations = [
        well for set in dilution_destination_sets for well in set]

    pipette.pick_up_tip()
    for dest in all_diluent_destinations:
        # Distribute diluent across the plate to the the number of samples
        # And add diluent to one column after the number of samples for a blank
        pipette.transfer(
                diluent_volume,
                diluent,
                dest,
                air_gap=air_gap_volume,
                new_tip='never')
    pipette.drop_tip()

    # Dilution of samples across the 96-well flat bottom plate
    if tip_use_strategy == 'never':
        pipette.pick_up_tip()
    for source_set, dest_set in zip(dilution_source_sets,
                                    dilution_destination_sets):
        for s, d in zip(source_set, dest_set):
            pipette.transfer(
                    transfer_volume,
                    s,
                    d,
                    air_gap=air_gap_volume,
                    mix_after=(5, total_mixing_volume/2),
                    new_tip=tip_use_strategy)
    if tip_use_strategy == 'never':
        pipette.drop_tip()

    if blank_on:
        pipette.pick_up_tip()
        for blank_well in blank_set:
            pipette.transfer(
                    diluent_volume,
                    diluent,
                    blank_well,
                    air_gap=air_gap_volume,
                    new_tip='never')
        pipette.drop_tip()