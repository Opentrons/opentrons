"""Test the dependency for locking endpoints based on Estop."""

from typing import TYPE_CHECKING, Optional

import pytest
from decoy import Decoy, matchers
from fastapi import status

from opentrons.config import feature_flags
from opentrons.hardware_control import ThreadManagedHardware
from opentrons.hardware_control.api import API
from opentrons.hardware_control.types import (
    EstopOverallStatus,
    EstopPhysicalStatus,
    EstopState,
)

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


from opentrons_shared_data.errors.codes import ErrorCode, ErrorCodes

from robot_server.errors.error_responses import ApiError
from robot_server.robot.control.dependencies import require_estop_in_good_state


@pytest.fixture
async def hardware_ot2(decoy: Decoy) -> API:
    return decoy.mock(cls=API)


@pytest.fixture
async def hardware_ot3(decoy: Decoy, request: pytest.FixtureRequest) -> "OT3API":
    request.node.add_marker("ot3_only")
    try:
        from opentrons.hardware_control.ot3api import OT3API

        return decoy.mock(cls=OT3API)
    except ImportError:
        return None  # type: ignore[return-type]


@pytest.fixture
async def thread_manager_ot2(decoy: Decoy, hardware_ot2: API) -> ThreadManagedHardware:
    thread_manager = decoy.mock(cls=ThreadManagedHardware)
    decoy.when(thread_manager.wrapped()).then_return(hardware_ot2)
    return thread_manager


@pytest.fixture
async def thread_manager_ot3(
    decoy: Decoy, hardware_ot3: "OT3API", request: pytest.FixtureRequest
) -> ThreadManagedHardware:
    request.node.add_marker("ot3_only")
    thread_manager = decoy.mock(cls=ThreadManagedHardware)
    decoy.when(thread_manager.wraps_instance(matchers.Anything())).then_return(True)
    decoy.when(thread_manager.wrapped()).then_return(hardware_ot3)
    return thread_manager


async def test_estop_ignored_ot2(
    decoy: Decoy, thread_manager_ot2: ThreadManagedHardware, mock_feature_flags: None
) -> None:
    """Test that we can use the dependency on OT-2."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    assert await require_estop_in_good_state(hardware_resource=thread_manager_ot2)


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    ["estop_state", "error_code"],
    [
        [EstopState.DISENGAGED, None],
        [EstopState.NOT_PRESENT, ErrorCodes.E_STOP_NOT_PRESENT.value],
        [EstopState.PHYSICALLY_ENGAGED, ErrorCodes.E_STOP_ACTIVATED.value],
        [EstopState.LOGICALLY_ENGAGED, ErrorCodes.E_STOP_ACTIVATED.value],
    ],
)
async def test_estop_ot3(
    hardware_ot3: "OT3API",
    thread_manager_ot3: ThreadManagedHardware,
    decoy: Decoy,
    estop_state: EstopState,
    error_code: Optional[ErrorCode],
    mock_feature_flags: None,
) -> None:
    """Test that ot3 hardware will check estop state."""
    decoy.when(feature_flags.hardware_subprocess_enabled()).then_return(False)
    decoy.when(await hardware_ot3.get_estop_status()).then_return(
        EstopOverallStatus(
            state=estop_state,
            left_physical_state=EstopPhysicalStatus.NOT_PRESENT,
            right_physical_state=EstopPhysicalStatus.NOT_PRESENT,
        )
    )

    if error_code is None:
        assert await require_estop_in_good_state(hardware_resource=thread_manager_ot3)
    else:
        with pytest.raises(ApiError) as details:
            await require_estop_in_good_state(hardware_resource=thread_manager_ot3)
        err = details.value

        assert err.status_code == status.HTTP_403_FORBIDDEN
        assert err.content["errors"][0]["errorCode"] == error_code.code
