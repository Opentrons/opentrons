import pytest


@pytest.fixture
def smoothie(monkeypatch):
    from opentrons.drivers.smoothie_drivers.v3_0_0.driver_3_0 import \
         SmoothieDriver_3_0_0 as SmoothieDriver

    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'true')
    driver = SmoothieDriver()
    driver.connect()
    yield driver
    driver.disconnect()
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'false')


def position(x, y, z, a, b, c):
    return {axis: value for axis, value in zip('XYZABC', [x, y, z, a, b, c])}


def test_functional(smoothie):
    from opentrons.drivers.smoothie_drivers.v3_0_0.driver_3_0 import HOMED_POSITIONS

    assert smoothie.position == position(0, 0, 0, 0, 0, 0)

    smoothie.move(x=0, y=1, z=2, a=3, b=4, c=5)
    assert smoothie.position == position(0, 1, 2, 3, 4, 5)

    smoothie.move(x=1, z=3, c=6)
    assert smoothie.position == position(1, 1, 3, 3, 4, 6)

    smoothie.home(axis='abc', disabled='')
    assert smoothie.position == position(
        1, 1, 3,
        HOMED_POSITIONS['A'],
        HOMED_POSITIONS['B'],
        HOMED_POSITIONS['C'])

    smoothie.home(disabled='')
    assert smoothie.position == HOMED_POSITIONS
