from opentrons.instruments.magbead import Magbead
from opentrons.instruments.pipette import Pipette
from opentrons.instruments.temperaturePlate import TemperaturePlate


__all__ = [
    Magbead,
    Pipette,
    TemperaturePlate
]


def load(axis, name):
    pass


def create(*args, **kwargs):
    return Pipette(*args, **kwargs)
