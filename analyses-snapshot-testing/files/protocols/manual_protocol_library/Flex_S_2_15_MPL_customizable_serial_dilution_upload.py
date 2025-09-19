def get_values(*names):
    import json

    _all_values = json.loads(
        """{"pipette_type":"flex_8channel_1000","mount_side":"right","tip_type":"1000f","trough_type":"nest_12_reservoir_15ml","plate_type":"nest_96_wellplate_200ul_flat","dilution_factor":3,"num_of_dilutions":10,"total_mixing_volume":150,"blank_on":true,"tip_use_strategy":"never","air_gap_volume":10,"protocol_filename":"Flex_customizable_serial_dilution_upload"}"""
    )
    return [_all_values[n] for n in names]


"""DETAILS."""

metadata = {"protocolName": "Customizable Serial Dilution", "author": "Opentrons <protocols@opentrons.com>", "source": "Protocol Library"}

requirements = {"robotType": "OT-3", "apiLevel": "2.15"}


def run(protocol_context):
    """PROTOCOL BODY."""
    [
        pipette_type,
        mount_side,
        tip_type,
        trough_type,
        plate_type,
        dilution_factor,
        num_of_dilutions,
        total_mixing_volume,
        blank_on,
        tip_use_strategy,
        air_gap_volume,
    ] = get_values(  # noqa: F821
        "pipette_type",
        "mount_side",
        "tip_type",
        "trough_type",
        "plate_type",
        "dilution_factor",
        "num_of_dilutions",
        "total_mixing_volume",
        "blank_on",
        "tip_use_strategy",
        "air_gap_volume",
    )
    # check for bad setup here
    if not 1 <= num_of_dilutions <= 11:
        raise Exception("Enter a number of dilutions between 1 and 11")

    if num_of_dilutions == 11 and blank_on == 1:
        raise Exception("No room for blank with 11 dilutions")

    tip_types_dict = {
        "50f": "opentrons_flex_96_filtertiprack_50ul",
        "50": "opentrons_flex_96_tiprack_50ul",
        "200f": "opentrons_flex_96_filtertiprack_200ul",
        "200": "opentrons_flex_96_tiprack_200ul",
        "1000f": "opentrons_flex_96_filtertiprack_1000ul",
        "1000": "opentrons_flex_96_tiprack_1000ul",
    }

    # labware
    trough = protocol_context.load_labware(trough_type, "2")
    plate = protocol_context.load_labware(plate_type, "3")
    tip_name = tip_types_dict[tip_type]
    tipracks = [protocol_context.load_labware(tip_name, slot) for slot in ["1", "4"]]

    # pipette
    pipette = protocol_context.load_instrument(pipette_type, mount_side, tipracks)
    pip_channel = float(pipette_type.split("_")[1][0])

    # reagents
    diluent = trough.wells()[0]
    source = plate.columns()[0]

    # define liquids (dilutent + original samples)
    dilutent_liquid = protocol_context.define_liquid(
        name="Dilutent", description="Diluent liquid is filled in the reservoir", display_color="#33FF33"
    )
    sample_liquid = protocol_context.define_liquid(
        name="Sample", description="Non-diluted samples are loaded in the 1st column", display_color="#FF0000"
    )
    # load dilutent
    diluent.load_liquid(liquid=dilutent_liquid, volume=0.8 * diluent.max_volume)
    # load sample
    for well in source:
        well.load_liquid(liquid=sample_liquid, volume=total_mixing_volume)

    transfer_volume = total_mixing_volume / dilution_factor
    diluent_volume = total_mixing_volume - transfer_volume

    if pip_channel == 8:
        dilution_destination_sets = [[row] for row in plate.rows()[0][1 : num_of_dilutions + 1]]
        dilution_source_sets = [[row] for row in plate.rows()[0][:num_of_dilutions]]
        blank_set = [plate.rows()[0][num_of_dilutions + 1]]
    else:
        dilution_destination_sets = plate.columns()[1 : num_of_dilutions + 1]
        dilution_source_sets = plate.columns()[:num_of_dilutions]
        blank_set = plate.columns()[num_of_dilutions + 1]
    all_diluent_destinations = [well for set in dilution_destination_sets for well in set]

    pipette.pick_up_tip()
    for dest in all_diluent_destinations:
        # Distribute diluent across the plate to the the number of samples
        # And add diluent to one column after the number of samples for a blank
        pipette.transfer(diluent_volume, diluent, dest, air_gap=air_gap_volume, new_tip="never")
    pipette.drop_tip()

    # Dilution of samples across the 96-well flat bottom plate
    if tip_use_strategy == "never":
        pipette.pick_up_tip()
    for source_set, dest_set in zip(dilution_source_sets, dilution_destination_sets):
        for s, d in zip(source_set, dest_set):
            pipette.transfer(
                transfer_volume, s, d, air_gap=air_gap_volume, mix_after=(5, total_mixing_volume / 2), new_tip=tip_use_strategy
            )
    if tip_use_strategy == "never":
        pipette.drop_tip()

    if blank_on:
        pipette.pick_up_tip()
        for blank_well in blank_set:
            pipette.transfer(diluent_volume, diluent, blank_well, air_gap=air_gap_volume, new_tip="never")
        pipette.drop_tip()
