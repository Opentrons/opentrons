def get_values(*names):
    import json
    _all_values = json.loads(
        """
        {
            "pipette_type": "p300_single",
            "dilution_factor": 1.5,
            "num_of_dilutions": 10,
            "total_mixing_volume": 200,
            "tip_use_strategy":"never"
        }
        """
    )
    return [_all_values[n] for n in names]


metadata = {
    'protocolName': 'Customizable Serial Dilution',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    'apiLevel': '2.2'
    }


def run(protocol_context):
    [pipette_type, dilution_factor, num_of_dilutions, total_mixing_volume,
        tip_use_strategy] = get_values(  # noqa: F821
            'pipette_type', 'dilution_factor', 'num_of_dilutions',
            'total_mixing_volume', 'tip_use_strategy'
        )

    # labware
    trough = protocol_context.load_labware(
        'usascientific_12_reservoir_22ml', '2')
    liquid_trash = trough.wells()[0]
    plate = protocol_context.load_labware(
        'corning_96_wellplate_360ul_flat', '3')
    tiprack = [
        protocol_context.load_labware('opentrons_96_tiprack_300ul', slot)
        for slot in ['1', '4']
    ]

    protocol_context.home()

    pip_name = pipette_type.split('_')[-1]

    pipette = protocol_context.load_instrument(
        pipette_type, mount='left', tip_racks=tiprack)

    transfer_volume = total_mixing_volume/dilution_factor
    diluent_volume = total_mixing_volume - transfer_volume

    if pip_name == 'multi':

        # Distribute diluent across the plate to the the number of samples
        # And add diluent to one column after the number of samples for a blank
        pipette.transfer(
            diluent_volume,
            trough.wells()[0],
            plate.rows()[0][1:1+num_of_dilutions]
        )

        # Dilution of samples across the 96-well flat bottom plate
        if tip_use_strategy == 'never':
            pipette.pick_up_tip()

        for s, d in zip(
                plate.rows()[0][:num_of_dilutions],
                plate.rows()[0][1:1+num_of_dilutions]
        ):
            pipette.transfer(
                transfer_volume,
                s,
                d,
                mix_after=(3, total_mixing_volume/2),
                new_tip=tip_use_strategy
            )

        # Remove transfer volume from the last column of the dilution
        pipette.transfer(
            transfer_volume,
            plate.rows()[0][num_of_dilutions],
            liquid_trash,
            new_tip=tip_use_strategy,
            blow_out=True
        )

        if tip_use_strategy == 'never':
            pipette.drop_tip()

    else:
        # Distribute diluent across the plate to the the number of samples
        # And add diluent to one column after the number of samples for a blank

        for col in plate.columns()[1:1+num_of_dilutions]:
            pipette.distribute(
                diluent_volume, trough.wells()[0], [well for well in col])

        for row in plate.rows():
            if tip_use_strategy == 'never':
                pipette.pick_up_tip()

            for s, d in zip(row[:num_of_dilutions], row[1:1+num_of_dilutions]):

                pipette.transfer(
                    transfer_volume,
                    s,
                    d,
                    mix_after=(3, total_mixing_volume/2),
                    new_tip=tip_use_strategy
                )

                pipette.transfer(
                    transfer_volume,
                    row[num_of_dilutions],
                    liquid_trash,
                    new_tip=tip_use_strategy,
                    blow_out=True
                )

            if tip_use_strategy == 'never':
                pipette.drop_tip()