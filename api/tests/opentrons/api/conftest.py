import pytest
from opentrons.api import models
from collections import namedtuple


def state(topic, state):
    def _match(item):
        return \
            item['name'] == 'state' and \
            item['topic'] == topic and \
            item['payload'].state == state

    return _match


def log_by_axis(log, axis):
    from functools import reduce

    def reducer(e1, e2):
        return {
            axis: e1[axis] + [round(e2[axis])]
            for axis in axis
        }

    return reduce(reducer, log, {axis: [] for axis in axis})


@pytest.fixture
def model():
    from opentrons import robot, instruments, containers

    robot.connect()
    robot._driver.home('za')
    robot._driver.home('bcx')
    robot._driver.home()

    pipette = instruments.Pipette(mount='right')
    plate = containers.load('96-flat', 'A1')

    instrument = models.Instrument(pipette)
    container = models.Container(plate)

    return namedtuple('model', 'instrument container')(
            instrument=instrument,
            container=container
        )
