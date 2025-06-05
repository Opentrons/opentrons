def get_values(*names):
    import json
    _all_values = json.loads("""{"pipette_type": "p300_single_gen2", "mount_side": "right", "tip_type": "standard", "trough_type": "nest_12_reservoir_15ml", "plate_type": "nest_96_wellplate_200ul_flat", "dilution_factor": 3, "num_of_dilutions": 10, "total_mixing_volume": 150, "blank_on": true, "tip_use_strategy": "never", "air_gap_volume": 10}""")
    return [_all_values[n] for n in names]


"""DETAILS."""
metadata = {
    "protocolName": "Customizable Serial Dilution",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.11",
}


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
    ] = get_values(
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
    if not 1 <= num_of_dilutions <= 11:
        raise Exception("Enter a number of dilutions between 1 and 11")
    if num_of_dilutions == 11 and blank_on == 1:
        raise Exception("No room for blank with 11 dilutions")
    pip_range = pipette_type.split("_")[0].lower()
    tiprack_map = {
        "p10": {"standard": "opentrons_96_tiprack_10ul", "filter": "opentrons_96_filtertiprack_20ul"},
        "p20": {"standard": "opentrons_96_tiprack_20ul", "filter": "opentrons_96_filtertiprack_20ul"},
        "p50": {"standard": "opentrons_96_tiprack_300ul", "filter": "opentrons_96_filtertiprack_200ul"},
        "p300": {"standard": "opentrons_96_tiprack_300ul", "filter": "opentrons_96_filtertiprack_200ul"},
        "p1000": {"standard": "opentrons_96_tiprack_1000ul", "filter": "opentrons_96_filtertiprack_1000ul"},
    }
    trough = protocol_context.load_labware(trough_type, "2")
    plate = protocol_context.load_labware(plate_type, "3")
    tip_name = tiprack_map[pip_range][tip_type]
    tipracks = [protocol_context.load_labware(tip_name, slot) for slot in ["1", "4"]]
    print(mount_side)
    pipette = protocol_context.load_instrument(pipette_type, mount_side, tipracks)
    diluent = trough.wells()[0]
    transfer_volume = total_mixing_volume / dilution_factor
    diluent_volume = total_mixing_volume - transfer_volume
    if "multi" in pipette_type:
        dilution_destination_sets = [[row] for row in plate.rows()[0][1:num_of_dilutions]]
        dilution_source_sets = [[row] for row in plate.rows()[0][: num_of_dilutions - 1]]
        blank_set = [plate.rows()[0][num_of_dilutions + 1]]
    else:
        dilution_destination_sets = plate.columns()[1:num_of_dilutions]
        dilution_source_sets = plate.columns()[: num_of_dilutions - 1]
        blank_set = plate.columns()[num_of_dilutions + 1]
    all_diluent_destinations = [well for set in dilution_destination_sets for well in set]
    pipette.pick_up_tip()
    for dest in all_diluent_destinations:
        pipette.transfer(diluent_volume, diluent, dest, air_gap=air_gap_volume, new_tip="never")
    pipette.drop_tip()
    if tip_use_strategy == "never":
        pipette.pick_up_tip()
    for source_set, dest_set in zip(dilution_source_sets, dilution_destination_sets):
        for s, d in zip(source_set, dest_set):
            pipette.transfer(
                transfer_volume,
                s,
                d,
                air_gap=air_gap_volume,
                mix_after=(5, total_mixing_volume / 2),
                new_tip=tip_use_strategy,
            )
    if tip_use_strategy == "never":
        pipette.drop_tip()
    if blank_on:
        pipette.pick_up_tip()
        for blank_well in blank_set:
            pipette.transfer(diluent_volume, diluent, blank_well, air_gap=air_gap_volume, new_tip="never")
        pipette.drop_tip()
