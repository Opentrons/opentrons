from .pipette import Pipette


__all__ = [
    'Pipette'
]


def load(axis, name):
    pass


def create(*args, **kwargs):
    return Pipette(*args, **kwargs)
