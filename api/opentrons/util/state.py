from opentrons.instruments import pipette
from opentrons.containers import placeable


def get_state(robot):
    return [
        {
            'axis': inst.axis,
            'label': inst.name,
            'channels': inst.channels,
            'top': inst.positions['top'],
            'bottom': inst.positions['bottom'],
            'blow_out': inst.positions['blow_out'],
            'drop_tip': inst.positions['drop_tip'],
            'max_volume': inst.max_volume,
            'calibrated': are_instrument_positions_calibrated(inst),
            'placeables': [
                {
                    'type': container.get_type(),
                    'label': container.get_name(),
                    'slot': container.get_parent().get_name(),
                    'calibrated': is_inst_calibrated_to_container(
                        inst, container
                    )
                }
                for container in get_unique_containers(inst)
            ]
        }
        for inst in get_all_pipettes(robot)
    ]


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

    return sort_containers(list(unique_containers))


def is_inst_calibrated_to_container(instrument, container):
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
    if len(positions.values()) != 4:
        return False

    return not any([
        str(val).endswith('.0101') for val in positions.values()
    ])


def get_all_pipettes(robot):
    """
    Returns all pipettes attached to robot
    """
    pipettes = [
        inst
        for _, inst in robot.get_instruments()
        if isinstance(inst, pipette.Pipette)
    ]
    return sorted(pipettes, key=lambda p: p.name.lower())


def _get_all_containers(robot):
    """
    Returns all containers currently on the deck
    """
    all_containers = list()
    for slot in robot._deck:
        if slot.has_children():
            all_containers += slot.get_children_list()

    return sort_containers(all_containers)


def sort_containers(container_list):
    """
    Returns the passed container list, sorted with tipracks first
    then alphabetically by name
    """
    def is_tiprack(container):
        return 'tip' in container.get_type().lower()

    tiprack_containers = filter(is_tiprack, container_list)
    other_containers = filter(lambda c: not is_tiprack(c), container_list)

    tipracks = sorted(
        tiprack_containers,
        key=lambda c: c.get_name().lower()
    )
    other = sorted(
        other_containers,
        key=lambda c: c.get_name().lower()
    )
    return tipracks + other
