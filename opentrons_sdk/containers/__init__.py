from opentrons_sdk.containers.legacy_containers import get_legacy_container
from opentrons_sdk.containers.placeable import (
    Deck,
    Slot,
    Container,
    Well,
    unpack_location
)
from opentrons_sdk.containers.calibrator import apply_calibration

__all__ = [
    get_legacy_container,
    Deck,
    Slot,
    Container,
    Well,
    unpack_location,
    apply_calibration]


def load(container_name, slot, label=None):
    from opentrons_sdk.robot import Robot
    if not label:
        label = container_name
    protocol = Robot.get_instance()
    return protocol.add_container(slot, container_name, label)
