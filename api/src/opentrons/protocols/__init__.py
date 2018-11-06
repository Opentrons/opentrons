import time
from itertools import chain
from opentrons import instruments, labware, robot
from opentrons.config import pipette_config


def _sleep(seconds):
    if not robot.is_simulating():
        time.sleep(seconds)


def load_pipettes(protocol_data):
    pipettes = protocol_data.get('pipettes', {})
    pipettes_by_id = {}

    for pipette_id, props in pipettes.items():
        model = props.get('model')
        mount = props.get('mount')

        # TODO: Ian 2018-11-06 remove this fallback to 'model' when
        # backwards-compatability for JSON protocols with versioned
        # pipettes is dropped (next JSON protocol schema major bump)
        name = props.get('name', model.split('_v')[0])

        pipette_name_version = instruments.retrieve_version_number(
            mount, name)
        config = pipette_config.load(pipette_name_version)

        pipette = instruments._create_pipette_from_config(
            config=config,
            mount=mount,
            name=pipette_name_version)

        pipettes_by_id[pipette_id] = pipette

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


def _get_location(loaded_labware, command_type, params, default_values):
    labwareId = params.get('labware')
    if not labwareId:
        # not all commands use labware param
        return None
    well = params.get('well')
    labware = loaded_labware.get(labwareId)
    if not labware:
        raise ValueError(
            'Command tried to use labware "{}", but that ID does not exist ' +
            'in protocol\'s "labware" section'.format(labwareId))

    # default offset from bottom for aspirate/dispense commands
    offset_default = default_values.get(
        '{}-mm-from-bottom'.format(command_type))

    # optional command-specific value, fallback to default
    offset_from_bottom = params.get(
        'offsetFromBottomMm', offset_default)

    if offset_from_bottom is None:
        # not all commands use offsets

        # touch-tip uses offset from top, not bottom, as default
        # when offsetFromBottomMm command-specific value is unset
        if command_type == 'touch-tip':
            # TODO: Ian 2018-10-29 remove this `-1` when
            # touch-tip-mm-from-top is a required field
            return labware.wells(well).top(
                z=default_values.get('touch-tip-mm-from-top', -1))

        return labware.wells(well)

    return labware.wells(well).bottom(offset_from_bottom)


def _get_pipette(command_params, loaded_pipettes):
    pipetteId = command_params.get('pipette')
    return loaded_pipettes.get(pipetteId)


# TODO (Ian 2018-08-22) once Pipette has more sensible way of managing
# flow rate value (eg as an argument in aspirate/dispense fns), remove this
def _set_flow_rate(
        pipette_name, pipette, command_type, params, default_values):
    """
    Set flow rate in uL/mm, to value obtained from command's params,
    or if unspecified in command params, then from protocol's "default-values".
    """
    default_aspirate = default_values.get(
        'aspirate-flow-rate', {}).get(pipette_name)

    default_dispense = default_values.get(
        'dispense-flow-rate', {}).get(pipette_name)

    flow_rate_param = params.get('flow-rate')

    if flow_rate_param is not None:
        if command_type == 'aspirate':
            pipette.set_flow_rate(
                aspirate=flow_rate_param,
                dispense=default_dispense)
            return
        if command_type == 'dispense':
            pipette.set_flow_rate(
                aspirate=default_aspirate,
                dispense=flow_rate_param)
            return

    pipette.set_flow_rate(
        aspirate=default_aspirate,
        dispense=default_dispense
    )


# C901 code complexity is due to long elif block, ok in this case (Ian+Ben)
def dispatch_commands(protocol_data, loaded_pipettes, loaded_labware):  # noqa: C901 E501
    subprocedures = [
        p.get('subprocedure', [])
        for p in protocol_data.get('procedure', [])]

    default_values = protocol_data.get('default-values', {})
    flat_subs = chain.from_iterable(subprocedures)

    for command_item in flat_subs:
        command_type = command_item.get('command')
        params = command_item.get('params', {})

        pipette = _get_pipette(params, loaded_pipettes)
        protocol_pipette_data = protocol_data\
            .get('pipettes', {})\
            .get(params.get('pipette'), {})
        pipette_name = protocol_pipette_data.get('name')

        if (not pipette_name):
            # TODO: Ian 2018-11-06 remove this fallback to 'model' when
            # backwards-compatability for JSON protocols with versioned
            # pipettes is dropped (next JSON protocol schema major bump)
            pipette_name = protocol_pipette_data.get('model')

        print('p pn', pipette, pipette_name)

        location = _get_location(
            loaded_labware, command_type, params, default_values)
        volume = params.get('volume')

        if pipette:
            # Aspirate/Dispense flow rate must be set each time for commands
            # which use pipettes right now.
            # Flow rate is persisted inside the Pipette object
            # and is settable but not easily gettable
            _set_flow_rate(
                pipette_name, pipette, command_type, params, default_values)

        if command_type == 'delay':
            wait = params.get('wait')
            if wait is None:
                raise ValueError('Delay cannot be null')
            elif wait is True:
                message = params.get('message', 'Pausing until user resumes')
                robot.pause(msg=message)
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
            # NOTE: if touch_tip can take a location tuple,
            # this can be much simpler
            (well_object, loc_tuple) = location

            # Use the offset baked into the well_object.
            # Do not allow API to apply its v_offset kwarg default value,
            # and do not apply the JSON protocol's default offset.
            z_from_bottom = loc_tuple[2]
            offset_from_top = (
                well_object.properties['depth'] - z_from_bottom) * -1

            pipette.touch_tip(well_object, v_offset=offset_from_top)


def execute_protocol(protocol):
    loaded_pipettes = load_pipettes(protocol)
    loaded_labware = load_labware(protocol)

    dispatch_commands(protocol, loaded_pipettes, loaded_labware)

    return {
        'pipettes': loaded_pipettes,
        'labware': loaded_labware
    }
