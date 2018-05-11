import json
from opentrons import instruments, labware, robot
from opentrons.instruments import pipette_config
# import dispatch TODO


def load_pipettes(protocol_data):
    pipettes = protocol_data['pipettes']
    pipettes_by_id = {}

    for pipette_id, props in pipettes.items():
        model = props['model']
        config = pipette_config.load(model)
        pipettes_by_id[pipette_id] = instruments._create_pipette_from_config(
            config=config,
            mount=props['mount'])

    return pipettes_by_id


def load_labware(protocol_data):
    data = protocol_data['labware']
    loaded_labware = {}
    for labware_id, props in data.items():
        if props['slot'] == '12':
            if props['model'] == 'fixed-trash':
                # pass in the pre-existing fixed-trash
                loaded_labware[labware_id] = robot.fixed_trash
            else:
                # share the slot with the fixed-trash
                loaded_labware[labware_id] = labware.load(
                    props['model'],
                    props['slot'],
                    props['display-name'],
                    share=True
                )
        else:
            loaded_labware[labware_id] = labware.load(
                props['model'],
                props['slot'],
                props['display-name']
            )

    return loaded_labware


def get_location(command_params, loaded_labware):
    labwareId = command_params['labware']
    well = command_params['well']
    return loaded_labware[labwareId][well]


def get_pipette(command_params, loaded_pipettes):
    pipetteId = command_params.get('pipette')
    return loaded_pipettes[pipetteId]


def dispatch_commands(protocol_data, loaded_pipettes, loaded_labware):
    for procedure in protocol_data['procedure']:
        subprocedure = procedure['subprocedure']

        for command_item in subprocedure:
            command_type = command_item['command']
            params = command_item['params']

            # TODO
            volume = params.get('volume')

            if command_type == 'drop-tip':
                pipette = get_pipette(params, loaded_pipettes)
                pipette.drop_tip()

            if command_type == 'blowout':
                print('TODO: no blowout?!?')

            if command_type == 'pick-up-tip':
                pipette = get_pipette(params, loaded_pipettes)
                location = get_location(params, loaded_labware)
                pipette.pick_up_tip(location)

            if command_type == 'aspirate':
                pipette = get_pipette(params, loaded_pipettes)
                location = get_location(params, loaded_labware)
                pipette.aspirate(
                    volume,
                    location
                )

            if command_type == 'dispense':
                pipette = get_pipette(params, loaded_pipettes)
                location = get_location(params, loaded_labware)
                pipette.dispense(
                    volume,
                    location
                )

            if command_type == 'delay':
                wait = params.get('wait')
                print('TODO: delay {}sec'.format(wait))


def execute_json(json_string):
    # TODO Ian 2018-05-11 use protocol-schema.json + jsonschema
    # to validate input before parsing & executing
    protocol_data = json.loads(json_string)

    loaded_pipettes = load_pipettes(protocol_data)
    loaded_labware = load_labware(protocol_data)

    dispatch_commands(protocol_data, loaded_pipettes, loaded_labware)

    return {
        'pipettes': loaded_pipettes,
        'labware': loaded_labware
    }
