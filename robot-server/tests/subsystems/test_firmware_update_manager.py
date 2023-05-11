"""Tests for UpdateProgressMonitor."""
from __future__ import annotations
import asyncio

import pytest
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, AsyncIterator, Union, Any
from decoy import Decoy

from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control.types import (
    OT3Mount,
    UpdateState as HWUpdateState,
    SubSystem as HWSubSystem,
    UpdateStatus as HWUpdateStatus,
)
from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel

from robot_server.service.task_runner import TaskRunner
from robot_server.subsystems.firmware_update_manager import (
    FirmwareUpdateManager,
    UpdateIdNotFound,
    UpdateFailed,
    UpdateProcessSummary,
    UpdateProgress as HWUpdateProgress,
    ProcessDetails,
    UpdateIdExists,
    UpdateInProgress,
)

from robot_server.subsystems.models import UpdateState, SubSystem

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.fixture
def decoy_task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mocked out TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
async def task_runner() -> AsyncIterator[TaskRunner]:
    """Get a real task runner that will be cleaned up properly."""
    runner = TaskRunner()
    try:
        yield runner
    finally:
        await runner.cancel_all_and_clean_up()


@pytest.mark.ot3_only
@pytest.fixture
def ot3_hardware_api(decoy: Decoy) -> OT3API:
    """Get a mocked out OT3API."""
    try:
        from opentrons.hardware_control.ot3api import OT3API

        return decoy.mock(cls=OT3API)
    except ImportError:
        return None  # type: ignore[return-value]


@pytest.fixture
def subject(task_runner: TaskRunner, ot3_hardware_api: OT3API) -> FirmwareUpdateManager:
    return FirmwareUpdateManager(task_runner, ot3_hardware_api)


async def test_start_update_times_out(subject: FirmwareUpdateManager) -> None:
    pass
