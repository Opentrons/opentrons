import json
import time
from itertools import chain
from opentrons import instruments, labware, robot
from opentrons.instruments import pipette_config


def _sleep(seconds):
    time.sleep(seconds)


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
                    props.get('display-name'),
                    share=True
                )
        else:
            loaded_labware[labware_id] = labware.load(
                props['model'],
                props['slot'],
                props.get('display-name')
            )

    return loaded_labware


def get_location(command_params, loaded_labware):
    labwareId = command_params.get('labware')
    well = command_params.get('well')
    return loaded_labware.get(labwareId, {}).get(well)


def get_pipette(command_params, loaded_pipettes):
    pipetteId = command_params.get('pipette')
    return loaded_pipettes.get(pipetteId)


def dispatch_commands(protocol_data, loaded_pipettes, loaded_labware):
    subprocedures = [p['subprocedure'] for p in protocol_data['procedure']]
    flat_subs = chain.from_iterable(subprocedures)

    for command_item in flat_subs:
        command_type = command_item['command']
        params = command_item['params']

        pipette = get_pipette(params, loaded_pipettes)
        location = get_location(params, loaded_labware)
        volume = params.get('volume')

        if command_type == 'delay':
            wait = params.get('wait', 0)
            if type(wait) is str:
                # TODO Ian 2018-05-14 pass message
                robot.pause()
            else:
                _sleep(wait)

        elif command_type == 'blowout':
            pipette.blow_out(location)

        elif command_type == 'pick-up-tip':
            pipette.pick_up_tip(location)

        elif command_type == 'drop-tip':
            pipette.drop_tip(location)

        elif command_type == 'aspirate':
            pipette.aspirate(volume, location)

        elif command_type == 'dispense':
            pipette.dispense(volume, location)


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
