import time
from itertools import chain
from opentrons import instruments, labware, robot
from opentrons.instruments import pipette_config


def _sleep(seconds):
    if not robot.is_simulating():
        time.sleep(seconds)


def load_pipettes(protocol_data):
    pipettes = protocol_data.get('pipettes', {})
    pipettes_by_id = {}

    for pipette_id, props in pipettes.items():
        model = props.get('model')
        mount = props.get('mount')
        config = pipette_config.load(model)
        pipettes_by_id[pipette_id] = instruments._create_pipette_from_config(
            config=config,
            mount=mount)

    return pipettes_by_id


def load_labware(protocol_data):
    data = protocol_data.get('labware', {})
    loaded_labware = {}
    for labware_id, props in data.items():
        slot = props.get('slot')
        model = props.get('model')
        display_name = props.get('display-name')

        if slot == '12':
            if model == 'fixed-trash':
                # pass in the pre-existing fixed-trash
                loaded_labware[labware_id] = robot.fixed_trash
            else:
                # share the slot with the fixed-trash
                loaded_labware[labware_id] = labware.load(
                    model,
                    slot,
                    display_name,
                    share=True
                )
        else:
            loaded_labware[labware_id] = labware.load(
                model,
                slot,
                display_name
            )

    return loaded_labware


def get_location(command_params, loaded_labware):
    labwareId = command_params.get('labware')
    well = command_params.get('well')
    return loaded_labware.get(labwareId, {}).get(well)


def get_pipette(command_params, loaded_pipettes):
    pipetteId = command_params.get('pipette')
    return loaded_pipettes.get(pipetteId)


# C901 code complexity is due to long elif block, ok in this case (Ian+Ben)
def dispatch_commands(protocol_data, loaded_pipettes, loaded_labware):  # noqa: C901 E501
    subprocedures = [
        p.get('subprocedure', [])
        for p in protocol_data.get('procedure', [])]

    flat_subs = chain.from_iterable(subprocedures)

    for command_item in flat_subs:
        command_type = command_item.get('command')
        params = command_item.get('params', {})

        pipette = get_pipette(params, loaded_pipettes)
        location = get_location(params, loaded_labware)
        volume = params.get('volume')

        if command_type == 'delay':
            wait = params.get('wait', 0)
            if wait is True:
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

        elif command_type == 'touch-tip':
            pipette.touch_tip(location)


def execute_protocol(protocol):
    loaded_pipettes = load_pipettes(protocol)
    loaded_labware = load_labware(protocol)

    dispatch_commands(protocol, loaded_pipettes, loaded_labware)

    return {
        'pipettes': loaded_pipettes,
        'labware': loaded_labware
    }
