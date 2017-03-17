from opentrons.instruments.magbead import Magbead
from opentrons.instruments.pipette import Pipette

__all__ = [
    Magbead,
    Pipette]


def load(axis, name):
    pass


def create(*args, **kwargs):
    return Pipette(*args, **kwargs)
