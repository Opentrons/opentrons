import pytest

@pytest.fixture
def robot():
    from opentrons import Robot
    return Robot()

@pytest.fixture
def message_broker():
    from opentrons.util.trace import MessageBroker
    return MessageBroker()