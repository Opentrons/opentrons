from opentrons.containers.persisted_containers import get_persisted_container
from opentrons.containers.persisted_containers import list_container_names
from opentrons.containers.placeable import (
    Deck,
    Slot,
    Container,
    Well,
    WellSeries,
    unpack_location
)
from opentrons.containers.calibrator import apply_calibration

__all__ = [
    get_persisted_container,
    Deck,
    Slot,
    Container,
    Well,
    WellSeries,
    unpack_location,
    apply_calibration]


def load(container_name, slot, label=None):
    """
    Examples
    --------
    >>> from opentrons import containers
    >>> containers.load('96-flat', 'A1')
    <Deck>/<Slot A1>/<Container 96-flat>
    >>> containers.load('96-flat', 'A2', 'plate')
    <Deck>/<Slot A2>/<Container plate>
    >>> containers.load('non-existent-type', 'A2') # doctest: +ELLIPSIS
    Exception: Container type "non-existent-type" not found in file ...
    """
    from opentrons import Robot
    if not label:
        label = container_name
    protocol = Robot.get_instance()
    return protocol.add_container(container_name, slot, label)


def list():
    return list_container_names()


def create(slot, grid, spacing, diameter, depth, name=None):
    columns, rows = grid
    col_spacing, row_spacing = spacing
    custom_container = Container()
    properties = {
        'type': 'custom',
        'radius': diameter / 2,
        'height': depth
    }

    for c in range(columns):
        for r in range(rows):
            well = Well(properties=properties)
            name = chr(c + ord('A')) + str(1 + r)
            coordinates = (c * col_spacing, r * row_spacing, 0)
            custom_container.add(well, name, coordinates)
    from opentrons import robot
    robot._deck[slot].add(custom_container, name)
    return custom_container
