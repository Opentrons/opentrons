from opentrons.containers.persisted_containers import get_persisted_container
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
