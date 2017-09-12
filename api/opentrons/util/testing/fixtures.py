import pytest

@pytest.fixture
def robot():
    from opentrons import Robot
    return Robot()