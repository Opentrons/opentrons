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

    return sort_containers(list(unique_containers))


# TODO: I think this should be removed once
# calibrating with respect to pipette is fully removed
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
    """
    Returns all pipettes attached to robot
    """
    pipettes = [
        inst
        for _, inst in robot.get_instruments()
        if isinstance(inst, pipette.Pipette)
    ]
    return sorted(pipettes, key=lambda p: p.name.lower())


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
