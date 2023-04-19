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
    InstrumentUpdateStatus,
    UpdateState,
    SubSystem,
    UpdateStatus,
)
from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel

from robot_server.service.task_runner import TaskRunner
from robot_server.instruments.firmware_update_manager import (
    FirmwareUpdateManager,
    InstrumentNotFound,
    UpdateIdNotFound,
    UpdateFailed,
    UpdateProcessSummary,
    UpdateProgress,
    ProcessDetails,
    UpdateIdExists,
    UpdateInProgress,
)

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


def get_sample_pipette_dict(
    name: PipetteName,
    model: PipetteModel,
    pipette_id: str,
    fw_update_required: bool,
) -> PipetteDict:
    """Return a sample PipetteDict."""
    pipette_dict: PipetteDict = {  # type: ignore [typeddict-item]
        "name": name,
        "model": model,
        "pipette_id": pipette_id,
        "back_compat_names": ["p10_single"],
        "min_volume": 1,
        "max_volume": 1,
        "channels": 1,
        "fw_update_required": fw_update_required,
        "fw_current_version": 1,
    }
    return pipette_dict


def get_default_pipette_dict() -> PipetteDict:
    """Get a pipette dict with a normal setup to save some typing."""
    return get_sample_pipette_dict(
        "p10_multi", PipetteModel("abc"), "my-pipette-id", True
    )


def mock_right_present_no_updates(ot3_hardware_api: OT3API, decoy: Decoy) -> OT3API:
    """Set up a hardware controller for update testing."""
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return({})
    decoy.when(ot3_hardware_api.get_all_attached_instr()).then_return(
        {OT3Mount.RIGHT: get_default_pipette_dict()}
    )
    return ot3_hardware_api


def build_firmware_progress_injector(
    decoy: Decoy, ot3_hardware_api: OT3API, mount: OT3Mount
) -> "asyncio.Queue[Union[Exception, UpdateStatus]]":
    """Utility function to get a queue to inject progress updates."""
    queue: "asyncio.Queue[Union[Exception, UpdateStatus]]" = asyncio.Queue()

    async def _inject(*_: Any, **__: Any) -> AsyncIterator[InstrumentUpdateStatus]:
        while True:
            item = await queue.get()
            if isinstance(item, Exception):
                raise item
            else:
                yield InstrumentUpdateStatus(mount, item.state, item.progress)
                if item.state == UpdateState.done:
                    return

    decoy.when(ot3_hardware_api.update_instrument_firmware(mount)).then_do(_inject)
    return queue


@pytest.mark.ot3_only
async def test_start_update(
    decoy: Decoy, ot3_hardware_api: OT3API, task_runner: TaskRunner
) -> None:
    """It should create an update resource and save to memory."""
    created_at = datetime(year=2023, month=12, day=2)
    mock_right_present_no_updates(ot3_hardware_api, decoy)
    inject_queue = build_firmware_progress_injector(
        decoy, ot3_hardware_api, OT3Mount.RIGHT
    )
    await inject_queue.put(
        UpdateStatus(SubSystem.pipette_right, UpdateState.updating, 2)
    )

    expected_data = UpdateProcessSummary(
        ProcessDetails(created_at, OT3Mount.RIGHT, "update-id"),
        UpdateProgress(UpdateState.updating, 2),
    )
    subject = FirmwareUpdateManager(hw_handle=ot3_hardware_api, task_runner=task_runner)
    handle = await subject.start_update_process(
        update_id="update-id",
        mount=OT3Mount.RIGHT,
        created_at=created_at,
        start_timeout_s=0.5,
    )

    assert (await handle.get_process_summary()) == expected_data
    assert subject.get_update_process_handle("update-id") == handle


@pytest.mark.ot3_only
async def test_create_update_resource_without_update_progress(
    decoy: Decoy, ot3_hardware_api: OT3API, task_runner: TaskRunner
) -> None:
    """It should fail to create resource when there is no update progress from HC."""
    created_at = datetime(year=2023, month=12, day=2)
    mock_right_present_no_updates(ot3_hardware_api, decoy)
    # We'll build a queue so the status requests waits infinitely, and we'll never put
    # anything in it so it times out
    _ = build_firmware_progress_injector(decoy, ot3_hardware_api, OT3Mount.RIGHT)

    subject = FirmwareUpdateManager(hw_handle=ot3_hardware_api, task_runner=task_runner)

    with pytest.raises(TimeoutError):
        await subject.start_update_process(
            update_id="update-id",
            mount=OT3Mount.RIGHT,
            created_at=created_at,
            start_timeout_s=0.5,
        )


@pytest.mark.ot3_only
async def test_get_completed_update_progress(
    decoy: Decoy, ot3_hardware_api: OT3API, task_runner: TaskRunner
) -> None:
    """It should provide a valid status for an existent resource with no status from hardware API."""
    created_at = datetime(year=2023, month=12, day=2)
    mock_right_present_no_updates(ot3_hardware_api, decoy)
    inject_queue = build_firmware_progress_injector(
        decoy, ot3_hardware_api, OT3Mount.RIGHT
    )
    await inject_queue.put(
        UpdateStatus(
            subsystem=SubSystem.pipette_right, state=UpdateState.done, progress=100
        )
    )
    subject = FirmwareUpdateManager(hw_handle=ot3_hardware_api, task_runner=task_runner)
    await subject.start_update_process(
        update_id="update-id",
        created_at=created_at,
        mount=OT3Mount.RIGHT,
        start_timeout_s=1,
    )

    handle = subject.get_update_process_handle("update-id")
    status = await handle.get_process_summary()
    assert status == UpdateProcessSummary(
        details=ProcessDetails(
            created_at=created_at,
            update_id="update-id",
            mount=OT3Mount.RIGHT,
        ),
        progress=UpdateProgress(
            state=UpdateState.done,
            progress=100,
        ),
    )


@pytest.mark.ot3_only
async def test_start_update_on_missing_instrument(
    decoy: Decoy, ot3_hardware_api: OT3API, task_runner: TaskRunner
) -> None:
    """It should raise error if instrument is no longer attached."""
    created_at = datetime(year=2023, month=12, day=2)
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return({})
    decoy.when(ot3_hardware_api.get_all_attached_instr()).then_return(
        {OT3Mount.RIGHT: None}
    )

    subject = FirmwareUpdateManager(hw_handle=ot3_hardware_api, task_runner=task_runner)
    with pytest.raises(InstrumentNotFound):
        await subject.start_update_process(
            update_id="update-id",
            created_at=created_at,
            mount=OT3Mount.RIGHT,
            start_timeout_s=1,
        )
    with pytest.raises(UpdateIdNotFound):
        subject.get_update_process_handle("update-id")


@pytest.mark.ot3_only
async def test_start_update_with_same_id_twice(
    decoy: Decoy, ot3_hardware_api: OT3API, task_runner: TaskRunner
) -> None:
    """It should raise an error if an update is created twice."""
    created_at = datetime(year=2023, month=12, day=2)
    mock_right_present_no_updates(ot3_hardware_api, decoy)
    inject_queue = build_firmware_progress_injector(
        decoy, ot3_hardware_api, OT3Mount.RIGHT
    )
    await inject_queue.put(
        UpdateStatus(
            subsystem=SubSystem.pipette_right, state=UpdateState.done, progress=100
        )
    )

    subject = FirmwareUpdateManager(hw_handle=ot3_hardware_api, task_runner=task_runner)
    _ = await subject.start_update_process("update-id-1", OT3Mount.RIGHT, created_at, 1)
    with pytest.raises(UpdateIdExists):
        await subject.start_update_process(
            "update-id-1",
            OT3Mount.LEFT,
            created_at + timedelta(minutes=10),
            start_timeout_s=1,
        )


@pytest.mark.ot3_only
async def test_start_update_while_update_in_progress(
    decoy: Decoy, ot3_hardware_api: OT3API, task_runner: TaskRunner
) -> None:
    """It should refuse to update a device that is already being updated."""
    created_at = datetime(year=2023, month=12, day=2)
    inject_queue = build_firmware_progress_injector(
        decoy, ot3_hardware_api, OT3Mount.RIGHT
    )
    await inject_queue.put(
        UpdateStatus(
            subsystem=SubSystem.pipette_right, state=UpdateState.done, progress=100
        )
    )
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return(
        {
            SubSystem.pipette_right: UpdateStatus(
                subsystem=SubSystem.pipette_right,
                state=UpdateState.updating,
                progress=10,
            )
        }
    )
    decoy.when(ot3_hardware_api.get_all_attached_instr()).then_return(
        {OT3Mount.RIGHT: get_default_pipette_dict()}
    )

    subject = FirmwareUpdateManager(hw_handle=ot3_hardware_api, task_runner=task_runner)
    with pytest.raises(UpdateInProgress):
        await subject.start_update_process(
            "update-id-1", OT3Mount.RIGHT, created_at, start_timeout_s=1
        )


@pytest.mark.ot3_only
async def test_update_failure(
    decoy: Decoy, ot3_hardware_api: OT3API, task_runner: TaskRunner
) -> None:
    """It should raise error if an instrument completes update process but still requires update."""
    created_at = datetime(year=2023, month=12, day=2)
    mock_right_present_no_updates(ot3_hardware_api, decoy)
    inject_queue = build_firmware_progress_injector(
        decoy, ot3_hardware_api, OT3Mount.RIGHT
    )
    await inject_queue.put(
        UpdateStatus(SubSystem.pipette_right, UpdateState.updating, 2)
    )

    subject = FirmwareUpdateManager(hw_handle=ot3_hardware_api, task_runner=task_runner)
    handle = await subject.start_update_process(
        update_id="update-id",
        created_at=created_at,
        mount=OT3Mount.RIGHT,
        start_timeout_s=1,
    )
    assert (await handle.get_progress()) == UpdateProgress(UpdateState.updating, 2)
    await inject_queue.put(RuntimeError("Oh no! Something went wrong!"))
    # Need a yield to let the update task pull the inject queue
    await asyncio.sleep(0)
    with pytest.raises(UpdateFailed):
        await handle.get_progress()


@pytest.mark.ot3_only
async def test_immediate_update_failure(
    decoy: Decoy, ot3_hardware_api: OT3API, task_runner: TaskRunner
) -> None:
    """It should raise error if an instrument completes update process but still requires update."""
    created_at = datetime(year=2023, month=12, day=2)
    inject_queue = build_firmware_progress_injector(
        decoy, ot3_hardware_api, OT3Mount.RIGHT
    )
    mock_right_present_no_updates(ot3_hardware_api, decoy)
    await inject_queue.put(
        UpdateStatus(
            subsystem=SubSystem.pipette_right,
            state=UpdateState.updating,
            progress=42,
        )
    )
    await inject_queue.put(RuntimeError("Oh no! Something went wrong!"))

    subject = FirmwareUpdateManager(hw_handle=ot3_hardware_api, task_runner=task_runner)
    handle = await subject.start_update_process(
        update_id="update-id",
        created_at=created_at,
        mount=OT3Mount.RIGHT,
        start_timeout_s=1,
    )
    with pytest.raises(UpdateFailed):
        await handle.get_process_summary()


@pytest.mark.ot3_only
def test_get_non_existent_update_progress(
    decoy: Decoy, ot3_hardware_api: OT3API, task_runner: TaskRunner
) -> None:
    """It should raise an error when fetching status using a non-existent ID."""
    subject = FirmwareUpdateManager(hw_handle=ot3_hardware_api, task_runner=task_runner)

    with pytest.raises(UpdateIdNotFound):
        subject.get_update_process_handle("update-id")
