from numpy import add
import time
import datetime
from opentrons import instruments, robot


def _sleep(seconds):
    if not robot.is_simulating():
        time.sleep(seconds)


def load_pipettes(protocol_data):
    pipettes = protocol_data.get('pipettes', {})
    pipettes_by_id = {}

    for pipette_id, props in pipettes.items():
        mount = props.get('mount')
        name = props.get('name')
        pipette = instruments.pipette_by_name(mount, name)
        pipettes_by_id[pipette_id] = pipette

    return pipettes_by_id


def load_labware(protocol_data):
    data = protocol_data['labware']
    defs = protocol_data['labwareDefinitions']
    loaded_labware = {}
    for labware_id, props in data.items():
        slot = props['slot']
        definition_id = props['definitionId']
        definition = defs.get(definition_id)
        if not definition:
            raise RuntimeError(
                'No definition under def id {}'.format(definition_id))
        display_name = props.get('displayName')

        if slot == '12':
            if 'fixedTrash' in definition['parameters'].get('quirks', []):
                # pass in the pre-existing fixed-trash
                loaded_labware[labware_id] = robot.fixed_trash
            else:
                raise RuntimeError(
                    'Only fixed trash labware can be placed in slot 12')
        else:
            loaded_labware[labware_id] = robot.add_container_by_definition(
                definition,
                slot,
                label=display_name
            )

    return loaded_labware


def _get_location(loaded_labware, command_type, params):
    labwareId = params.get('labware')
    if not labwareId:
        # not all commands use labware param
        return None
    well = params.get('well')
    lw = loaded_labware.get(labwareId)
    if not lw:
        raise ValueError(
            'Command tried to use labware "{}", but that ID does not exist ' +
            'in protocol\'s "labware" section'.format(labwareId))

    offset_from_bottom = params.get('offsetFromBottomMm')

    if offset_from_bottom is None:
        # not all commands use offsets (eg pick up tip / drop tip)
        return lw.wells(well)

    return lw.wells(well).bottom(offset_from_bottom)


def _get_pipette(command_params, loaded_pipettes):
    pipetteId = command_params.get('pipette')
    return loaded_pipettes.get(pipetteId)


# TODO (Ian 2018-08-22) once Pipette has more sensible way of managing
# flow rate value (eg as an argument in aspirate/dispense fns), remove this
def _set_flow_rate(
        pipette_name, pipette, command_type, params):
    """
    Set flow rate in uL/mm, to value obtained from command's params
    """
    flow_rate_param = params.get('flowRate')

    pipette.set_flow_rate(
        aspirate=flow_rate_param,
        dispense=flow_rate_param)
    return


# C901 code complexity is due to long elif block, ok in this case (Ian+Ben)
def dispatch_commands(protocol_data, loaded_pipettes, loaded_labware):  # noqa: C901 E501
    commands = protocol_data['commands']

    for command_item in commands:
        command_type = command_item['command']
        params = command_item.get('params', {})

        pipette = _get_pipette(params, loaded_pipettes)
        protocol_pipette_data = protocol_data\
            .get('pipettes', {})\
            .get(params.get('pipette'), {})
        pipette_name = protocol_pipette_data.get('name')

        location = _get_location(
            loaded_labware, command_type, params)
        volume = params.get('volume')

        if pipette:
            # Aspirate/Dispense flow rate must be set each time for commands
            # which use pipettes right now.
            # Flow rate is persisted inside the Pipette object
            # and is settable but not easily gettable
            _set_flow_rate(
                pipette_name, pipette, command_type, params)

        if command_type == 'delay':
            wait = params.get('wait')
            message = params.get('message')
            if wait is None:
                raise ValueError('Delay cannot be null')
            elif wait is True:
                message = message or 'Pausing until user resumes'
                robot.pause(msg=message)
            else:
                text = f'Delaying for {datetime.timedelta(seconds=wait)}'
                if message:
                    text = f"{text}. {message}"
                robot.comment(text)
                _sleep(wait)

        elif command_type == 'blowout':
            pipette.blow_out(location)

        elif command_type == 'pickUpTip':
            pipette.pick_up_tip(location)

        elif command_type == 'dropTip':
            pipette.drop_tip(location)

        elif command_type == 'aspirate':
            pipette.aspirate(volume, location)

        elif command_type == 'dispense':
            pipette.dispense(volume, location)

        elif command_type == 'touchTip':
            # NOTE: if touch_tip can take a location tuple,
            # this can be much simpler
            (well_object, loc_tuple) = location

            # Use the offset baked into the well_object.
            # Do not allow API to apply its v_offset kwarg default value
            z_from_bottom = loc_tuple[2]
            offset_from_top = (
                well_object.properties['depth'] - z_from_bottom) * -1

            pipette.touch_tip(well_object, v_offset=offset_from_top)

        elif command_type == 'moveToSlot':
            slot = params.get('slot')
            if slot not in [str(s+1) for s in range(12)]:
                raise ValueError('"moveToSlot" requires a valid slot, got {}'
                                 .format(slot))
            x_offset = params.get('offset', {}).get('x', 0)
            y_offset = params.get('offset', {}).get('y', 0)
            z_offset = params.get('offset', {}).get('z', 0)
            slot_placeable = robot.deck[slot]
            slot_offset = (x_offset, y_offset, z_offset)

            strategy = 'direct' if params.get('forceDirect') else None

            # NOTE: Robot.move_to subtracts the offset from Slot.top()[1],
            # so in order not to translate our desired offset,
            # we have to compensate by adding it here :/
            pipette.move_to(
                (slot_placeable,
                 add(slot_offset, tuple(slot_placeable.top()[1]))),
                strategy=strategy)
