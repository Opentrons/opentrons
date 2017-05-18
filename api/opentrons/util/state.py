from opentrons.instruments import pipette
from opentrons.containers import placeable

def get_unique_containers(instrument):
    """
    Returns all associated containers for an instrument
    """
    unique_containers = set()
    for location in instrument.placeables:
        if isinstance(location, placeable.WellSeries):
            location = location[0]
        for c in location.get_trace():
            if isinstance(c, placeable.Container):
                unique_containers.add(c)

    return _sort_containers(list(unique_containers))

def create_step_list(robot):
    return [{
            'axis': instrument.axis,
            'label': instrument.name,
            'channels': instrument.channels,
            'placeables': [
                {
                    'type': container.get_type(),
                    'label': container.get_name(),
                    'slot': container.get_parent().get_name()
                }
                for container in get_unique_containers(instrument)
                ]
        } for instrument in get_all_pipettes(robot)]


def get_state(robot):
    #if current_protocol_step_list is None:
     #   create_step_list()

    step_list = create_step_list(robot)
    for step in step_list:
        t_axis = str(step['axis']).upper()
        instrument = robot._instruments[t_axis]
        step.update({
            'top': instrument.positions['top'],
            'bottom': instrument.positions['bottom'],
            'blow_out': instrument.positions['blow_out'],
            'drop_tip': instrument.positions['drop_tip'],
            'max_volume': instrument.max_volume,
            'calibrated': are_instrument_positions_calibrated(instrument)
        })

        for placeable_step in step['placeables']:
            c = get_container_from_step(robot, placeable_step)
            if c:
                placeable_step.update({
                    'calibrated': is_instrument_calibrated_to_container(instrument, c)
                })


def is_instrument_calibrated_to_container(instrument, container):
    """
    Returns True if instrument holds calibration data for a Container
    """
    slot = container.get_parent().get_name()
    label = container.get_name()
    data = instrument.calibration_data
    if slot in data:
        if label in data[slot].get('children'):
            return True
    return False


def are_instrument_positions_calibrated(instrument):
    # TODO: rethink calibrating instruments other than Pipette
    if not isinstance(instrument, pipette.Pipette):
        return True

    positions = instrument.positions
    for p in positions:
        if positions.get(p) is None:
            return False

    return True


def get_all_pipettes(robot):
    pipette_list = []
    for _, p in robot.get_instruments():
        if isinstance(p, pipette.Pipette):
            pipette_list.append(p)
    return sorted(
        pipette_list,
        key=lambda p: p.name.lower()
    )


def _get_all_containers(robot):
    """
    Returns all containers currently on the deck
    """
    all_containers = list()
    for slot in robot._deck:
        if slot.has_children():
            all_containers += slot.get_children_list()

    return _sort_containers(all_containers)


def get_container_from_step(robot, step):
    """
    Retruns the matching Container for a given placeable step in the step-list
    """
    all_containers = _get_all_containers(robot)
    for container in all_containers:
        match = [
            container.get_name() == step['label'],
            container.get_parent().get_name() == step['slot'],
            container.get_type() == step['type']

        ]
        if all(match):
            return container
    return None


def _sort_containers(container_list):
    """
    Returns the passed container list, sorted with tipracks first
    then alphabetically by name
    """
    tipracks = []
    other = []
    # TODO: refactor into a filter/lambda
    for c in container_list:
        _type = c.get_type().lower()
        if 'tip' in _type:
            tipracks.append(c)
        else:
            other.append(c)

    tipracks = sorted(
        tipracks,
        key=lambda c: c.get_name().lower()
    )
    other = sorted(
        other,
        key=lambda c: c.get_name().lower()
    )

    return tipracks + other