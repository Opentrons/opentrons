import asyncio
import pytest
from functools import partial
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


async def wait_until(matcher, notifications, timeout=1, loop=None):
    result = []
    for coro in iter(notifications.__anext__, None):
        done, pending = await asyncio.wait([coro], timeout=timeout)

        if pending:
            raise TimeoutError('Notifications: {0}'.format(result))

        result += [done.pop().result()]

        if matcher(result[-1]):
            return result


@pytest.fixture
def model():
    from opentrons import robot, instruments, containers

    robot.reset()

    pipette = instruments.Pipette(mount='right')
    plate = containers.load('96-flat', 'A1')

    instrument = models.Instrument(pipette)
    container = models.Container(plate)

    return namedtuple('model', 'instrument container')(
            instrument=instrument,
            container=container
        )


@pytest.fixture
def main_router(loop, monkeypatch):
    from opentrons.api.routers import MainRouter
    from opentrons import robot

    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'true')
    with MainRouter(loop=loop) as router:
        router.wait_until = partial(
            wait_until,
            notifications=router.notifications,
            loop=loop)
        yield router
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'false')
    robot.reset()
