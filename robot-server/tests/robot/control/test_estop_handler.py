"""Test estop handler wrapper class."""

from decoy import Decoy
import pytest
from typing import List, Tuple, TYPE_CHECKING

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API

from robot_server.robot.control.estop_handler import EstopHandler
from robot_server.robot.control.models import (
    EstopState,
    EstopPhysicalStatus,
)
from opentrons.hardware_control.types import (
    EstopState as HwEstopState,
    EstopPhysicalStatus as HwEstopPhysicalStatus,
    EstopOverallStatus,
)


@pytest.fixture
def mock_hardware(decoy: Decoy) -> "OT3API":
    """Create a mocked hardware api."""
    return decoy.mock(cls="OT3API")


@pytest.fixture
def subject(mock_hardware: "OT3API") -> EstopHandler:
    """Create an EstopHandler to test."""
    return EstopHandler(hw_handle=mock_hardware)


def test_estop_state_transform(
    subject: EstopHandler, mock_hardware: "OT3API", decoy: Decoy
) -> None:
    """Check that the state is transformed correctly."""
    steps: List[Tuple[HwEstopState, EstopState]] = [
        (HwEstopState.NOT_PRESENT, EstopState.NOT_PRESENT),
        (HwEstopState.PHYSICALLY_ENGAGED, EstopState.PHYSICALLY_ENGAGED),
        (HwEstopState.LOGICALLY_ENGAGED, EstopState.LOGICALLY_ENGAGED),
        (HwEstopState.DISENGAGED, EstopState.DISENGAGED),
    ]
    for (input, output) in steps:
        decoy.when(mock_hardware.estop_status).then_return(
            EstopOverallStatus(
                state=input,
                left_physical_state=EstopPhysicalStatus.NOT_PRESENT,
                right_physical_state=EstopPhysicalStatus.NOT_PRESENT,
            )
        )
        assert subject.get_state() == output


def test_estop_physical_state_transform(
    subject: EstopHandler, mock_hardware: "OT3API", decoy: Decoy
) -> None:
    """Check that physical state gets transformed correctly."""
    steps: List[Tuple[EstopOverallStatus, EstopPhysicalStatus, EstopPhysicalStatus]] = [
        (
            EstopOverallStatus(
                state=HwEstopState.DISENGAGED,
                left_physical_state=HwEstopPhysicalStatus.DISENGAGED,
                right_physical_state=HwEstopPhysicalStatus.NOT_PRESENT,
            ),
            EstopPhysicalStatus.DISENGAGED,
            EstopPhysicalStatus.NOT_PRESENT,
        ),
        (
            EstopOverallStatus(
                state=HwEstopState.DISENGAGED,
                left_physical_state=HwEstopPhysicalStatus.DISENGAGED,
                right_physical_state=HwEstopPhysicalStatus.DISENGAGED,
            ),
            EstopPhysicalStatus.DISENGAGED,
            EstopPhysicalStatus.DISENGAGED,
        ),
        (
            EstopOverallStatus(
                state=HwEstopState.DISENGAGED,
                left_physical_state=HwEstopPhysicalStatus.NOT_PRESENT,
                right_physical_state=HwEstopPhysicalStatus.DISENGAGED,
            ),
            EstopPhysicalStatus.NOT_PRESENT,
            EstopPhysicalStatus.DISENGAGED,
        ),
        (
            EstopOverallStatus(
                state=HwEstopState.PHYSICALLY_ENGAGED,
                left_physical_state=HwEstopPhysicalStatus.ENGAGED,
                right_physical_state=HwEstopPhysicalStatus.NOT_PRESENT,
            ),
            EstopPhysicalStatus.ENGAGED,
            EstopPhysicalStatus.NOT_PRESENT,
        ),
    ]

    for (input, left, right) in steps:
        decoy.when(mock_hardware.estop_status).then_return(input)
        assert subject.get_left_physical_status() == left
        assert subject.get_right_physical_status() == right


def test_estop_acknowledge_and_clear(
    subject: EstopHandler, mock_hardware: "OT3API", decoy: Decoy
) -> None:
    """Test that the hardware controller is called correctly."""
    subject.acknowledge_and_clear()
    decoy.verify(mock_hardware.estop_acknowledge_and_clear())
