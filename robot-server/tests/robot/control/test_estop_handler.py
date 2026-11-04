"""Test estop handler wrapper class."""

from typing import TYPE_CHECKING

import pytest
from decoy import Decoy

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API

from opentrons.hardware_control.types import (
    EstopOverallStatus,
)
from opentrons.hardware_control.types import (
    EstopPhysicalStatus as HwEstopPhysicalStatus,
)
from opentrons.hardware_control.types import (
    EstopState as HwEstopState,
)

from robot_server.robot.control.estop_handler import EstopHandler
from robot_server.robot.control.models import (
    EstopPhysicalStatus,
    EstopState,
    EstopStatusModel,
)


@pytest.fixture
def mock_hardware(decoy: Decoy, request: pytest.FixtureRequest) -> "OT3API":
    """Create a mocked hardware api."""
    request.node.add_marker("ot3_only")
    try:
        from opentrons.hardware_control.ot3api import OT3API

        return decoy.mock(cls=OT3API)
    except ImportError:
        return None  # type: ignore[return-value]


@pytest.fixture
def subject(mock_hardware: "OT3API") -> EstopHandler:
    """Create an EstopHandler to test."""
    return EstopHandler(hw_handle=mock_hardware)


@pytest.mark.parametrize(
    "overall_state_in,overall_state_out",
    [
        (HwEstopState.NOT_PRESENT, EstopState.NOT_PRESENT),
        (HwEstopState.PHYSICALLY_ENGAGED, EstopState.PHYSICALLY_ENGAGED),
        (HwEstopState.LOGICALLY_ENGAGED, EstopState.LOGICALLY_ENGAGED),
        (HwEstopState.DISENGAGED, EstopState.DISENGAGED),
    ],
)
@pytest.mark.parametrize(
    "physical_state_in,physical_state_out",
    [
        (HwEstopPhysicalStatus.DISENGAGED, EstopPhysicalStatus.DISENGAGED),
        (HwEstopPhysicalStatus.NOT_PRESENT, EstopPhysicalStatus.NOT_PRESENT),
        (HwEstopPhysicalStatus.ENGAGED, EstopPhysicalStatus.ENGAGED),
    ],
)
async def test_estop_physical_state_transform(
    overall_state_in: HwEstopState,
    overall_state_out: EstopState,
    physical_state_in: HwEstopPhysicalStatus,
    physical_state_out: EstopPhysicalStatus,
    subject: EstopHandler,
    mock_hardware: "OT3API",
    decoy: Decoy,
) -> None:
    """Check that physical state gets transformed correctly."""
    input = EstopOverallStatus(
        state=overall_state_in,
        left_physical_state=physical_state_in,
        right_physical_state=physical_state_in,
    )
    output = EstopStatusModel(
        status=overall_state_out,
        leftEstopPhysicalStatus=physical_state_out,
        rightEstopPhysicalStatus=physical_state_out,
    )
    decoy.when(await mock_hardware.get_estop_status()).then_return(input)
    assert await subject.get_status() == output


async def test_estop_acknowledge_and_clear(
    subject: EstopHandler, mock_hardware: "OT3API", decoy: Decoy
) -> None:
    """Test that the hardware controller is called correctly."""
    await subject.acknowledge_and_clear()
    decoy.verify(await mock_hardware.estop_acknowledge_and_clear())
