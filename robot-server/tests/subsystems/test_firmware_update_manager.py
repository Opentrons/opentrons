"""Tests for UpdateProgressMonitor."""
from __future__ import annotations
import asyncio

import pytest
from datetime import datetime
from typing import (
    TYPE_CHECKING,
    AsyncIterator,
    Set,
    Dict,
    Optional,
)
from typing_extensions import Protocol
from decoy import Decoy

from opentrons.hardware_control.types import (
    UpdateState as HWUpdateState,
    SubSystem as HWSubSystem,
    UpdateStatus as HWUpdateStatus,
    SubSystemState,
    StatusBarState,
)
from opentrons.hardware_control.errors import UpdateOngoingError as HWUpdateOngoingError

from robot_server.service.task_runner import TaskRunner
from robot_server.subsystems.firmware_update_manager import (
    FirmwareUpdateManager,
    UpdateIdNotFound,
    UpdateIdExists,
    UpdateInProgress,
    SubsystemNotFound,
    NoOngoingUpdate,
    AnimationHandler,
)

from robot_server.subsystems.models import UpdateState, SubSystem

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.fixture
def decoy_task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mocked out TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
def decoy_animation_handler(decoy: Decoy) -> AnimationHandler:
    """Get a mocked out AnimationHandler."""
    return decoy.mock(cls=AnimationHandler)


@pytest.fixture
async def task_runner() -> AsyncIterator[TaskRunner]:
    """Get a real task runner that will be cleaned up properly."""
    runner = TaskRunner()
    try:
        yield runner
    finally:
        await runner.cancel_all_and_clean_up()


@pytest.fixture
def ot3_hardware_api(decoy: Decoy) -> OT3API:
    """Get a mocked out OT3API."""
    try:
        from opentrons.hardware_control.ot3api import OT3API

        return decoy.mock(cls=OT3API)
    except ImportError:
        return None  # type: ignore[return-value]


@pytest.fixture
def subject(
    task_runner: TaskRunner,
    ot3_hardware_api: OT3API,
    decoy_animation_handler: AnimationHandler,
) -> FirmwareUpdateManager:
    """Get a FirmwareUpdateManager to test."""
    return FirmwareUpdateManager(task_runner, ot3_hardware_api, decoy_animation_handler)


def _build_attached_subsystem(
    subsystem: HWSubSystem,
    ok: bool = True,
    needs_update: bool = False,
    updating: bool = False,
) -> SubSystemState:
    return SubSystemState(
        ok=ok,
        current_fw_version=10,
        next_fw_version=10,
        fw_update_needed=needs_update,
        current_fw_sha="somesha",
        pcba_revision="hello",
        update_state=HWUpdateState.updating if updating else None,
    )


def _build_attached_subsystems(
    subsystems: Set[HWSubSystem],
) -> Dict[HWSubSystem, SubSystemState]:
    return {subsystem: _build_attached_subsystem(subsystem) for subsystem in subsystems}


class MockUpdater(Protocol):
    """Wraps a mock updater function."""

    # Note: this function is not typed like you would expect! It has to match
    # async def update_firmware(
    #     self, subsystems: Optional[Set[Subsystem]] = None, force: bool = False
    # ) -> AsyncIterator[Set[UpdateStatus]]
    # and does, because mypy's translation does not apply the same rules to a protocol
    # __call__ that it does to a general function, where it would fuse the async transformation
    # and the AsyncIterator return value. If this is defined as async def __call__, mypy will
    # decide it returns Coroutine[Any, Any, AsyncIterator[Set[UpdateStatus]]].
    def __call__(
        self, subsystems: Optional[Set[HWSubSystem]] = None, force: bool = False
    ) -> AsyncIterator[HWUpdateStatus]:
        """Function signature."""
        ...


async def _quick_update(
    subsystems: Optional[Set[HWSubSystem]] = None, force: bool = False
) -> AsyncIterator[HWUpdateStatus]:
    assert subsystems
    subsystem = next(iter(subsystems))
    yield HWUpdateStatus(subsystem, HWUpdateState.queued, 0)
    await asyncio.sleep(0)
    for value in range(0, 100, 10):
        yield HWUpdateStatus(subsystem, HWUpdateState.updating, value)
        await asyncio.sleep(0)


async def _eternal_update(
    subsystems: Optional[Set[HWSubSystem]] = None, force: bool = False
) -> AsyncIterator[HWUpdateStatus]:
    assert subsystems
    subsystem = next(iter(subsystems))
    while True:
        yield HWUpdateStatus(subsystem, HWUpdateState.queued, 0)
        await asyncio.sleep(0)


async def _instant_update(
    subsystems: Optional[Set[HWSubSystem]] = None, force: bool = False
) -> AsyncIterator[HWUpdateStatus]:
    assert subsystems
    subsystem = next(iter(subsystems))
    yield HWUpdateStatus(subsystem, HWUpdateState.done, 100)
    await asyncio.sleep(0)


async def _conflicting_update(
    subsystems: Optional[Set[HWSubSystem]] = None, force: bool = False
) -> AsyncIterator[HWUpdateStatus]:
    raise HWUpdateOngoingError("uh oh")
    # this yield is here to make python make this a generator
    yield


async def _error_update(
    subsystems: Optional[Set[HWSubSystem]], force: bool = False
) -> AsyncIterator[HWUpdateStatus]:
    assert subsystems
    subsystem = next(iter(subsystems))
    yield HWUpdateStatus(subsystem, HWUpdateState.queued, 0)
    await asyncio.sleep(0)
    for value in range(0, 30, 10):
        yield HWUpdateStatus(subsystem, HWUpdateState.updating, value)
        await asyncio.sleep(0)
    raise RuntimeError("oh no!")


async def _baseexception_update(
    subsystems: Optional[Set[HWSubSystem]], force: bool = False
) -> AsyncIterator[HWUpdateStatus]:
    assert subsystems
    subsystem = next(iter(subsystems))
    yield HWUpdateStatus(subsystem, HWUpdateState.queued, 0)
    await asyncio.sleep(0)
    for value in range(0, 30, 10):
        yield HWUpdateStatus(subsystem, HWUpdateState.updating, value)
        await asyncio.sleep(0)
    raise BaseException()


@pytest.mark.ot3_only
async def test_updates_of_non_present_subsystems_fail(
    subject: FirmwareUpdateManager, ot3_hardware_api: OT3API, decoy: Decoy
) -> None:
    """It should refuse to start an update for a non-present subsystem."""
    decoy.when(ot3_hardware_api.attached_subsystems).then_return(
        _build_attached_subsystems({HWSubSystem.gantry_x, HWSubSystem.gantry_y})
    )
    with pytest.raises(SubsystemNotFound):
        await subject.start_update_process(
            "some-id", SubSystem.pipette_right, datetime.now()
        )


@pytest.mark.ot3_only
async def test_duplicate_ids_fail(
    subject: FirmwareUpdateManager, ot3_hardware_api: OT3API, decoy: Decoy
) -> None:
    """It should fail to create an update if given a duplicate ID."""
    decoy.when(ot3_hardware_api.update_firmware).then_return(_eternal_update)
    decoy.when(ot3_hardware_api.attached_subsystems).then_return(
        _build_attached_subsystems({HWSubSystem.gantry_x})
    )
    await subject.start_update_process("some-id", SubSystem.gantry_x, datetime.now())

    with pytest.raises(UpdateIdExists):
        await subject.start_update_process(
            "some-id", SubSystem.gantry_x, datetime.now()
        )


@pytest.mark.ot3_only
async def test_conflicting_in_progress_updates_fail(
    subject: FirmwareUpdateManager, ot3_hardware_api: OT3API, decoy: Decoy
) -> None:
    """It should fail to start an update when one is ongoing."""

    async def eternal_update(
        subsystems: Set[HWSubSystem],
    ) -> AsyncIterator[HWUpdateStatus]:
        assert subsystems == {HWSubSystem.gantry_x}
        while True:
            yield HWUpdateStatus(HWSubSystem.gantry_x, HWUpdateState.queued, 0)
            await asyncio.sleep(0)

    decoy.when(ot3_hardware_api.update_firmware).then_return(_eternal_update)
    decoy.when(ot3_hardware_api.attached_subsystems).then_return(
        _build_attached_subsystems({HWSubSystem.gantry_x})
    )
    await subject.start_update_process("some-id", SubSystem.gantry_x, datetime.now())

    with pytest.raises(UpdateInProgress):
        await subject.start_update_process(
            "some-other-id", SubSystem.gantry_x, datetime.now()
        )


@pytest.mark.ot3_only
async def test_ongoing_updates_accessible(
    subject: FirmwareUpdateManager, ot3_hardware_api: OT3API, decoy: Decoy
) -> None:
    """Updates that are currently running should be accessible by subsystem and id."""
    decoy.when(ot3_hardware_api.update_firmware).then_return(_eternal_update)
    decoy.when(ot3_hardware_api.attached_subsystems).then_return(
        _build_attached_subsystems({HWSubSystem.gantry_x})
    )
    proc = await subject.start_update_process(
        "some-id", SubSystem.gantry_x, datetime.now()
    )
    assert subject.get_update_process_handle_by_id("some-id") == proc
    assert proc in subject.all_update_processes()
    assert (
        await subject.get_ongoing_update_process_handle_by_subsystem(SubSystem.gantry_x)
        == proc
    )
    assert proc in (await subject.all_ongoing_processes())


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "updater",
    (
        _instant_update,
        _quick_update,
        _conflicting_update,
        _error_update,
        _baseexception_update,
    ),
)
async def test_complete_updates_leave_ongoing(
    updater: MockUpdater,
    subject: FirmwareUpdateManager,
    ot3_hardware_api: OT3API,
    decoy_animation_handler: AnimationHandler,
    decoy: Decoy,
) -> None:
    """It should move completed updates out of ongoing whether they succeed or fail."""
    decoy.when(ot3_hardware_api.update_firmware).then_return(updater)
    decoy.when(ot3_hardware_api.attached_subsystems).then_return(
        _build_attached_subsystems({HWSubSystem.gantry_x})
    )
    proc = await subject.start_update_process(
        "some-id", SubSystem.gantry_x, datetime.now()
    )
    while (await proc.get_progress()).state in (
        UpdateState.queued,
        UpdateState.updating,
    ):
        await asyncio.sleep(0)
    # Sadly we do have to have that extra little couple spins to get the update out of
    # ongoing since the done-callback holds a lock and is async
    await asyncio.sleep(0.1)
    with pytest.raises(NoOngoingUpdate):
        await subject.get_ongoing_update_process_handle_by_subsystem(SubSystem.gantry_x)
    assert subject.get_update_process_handle_by_id("some-id") == proc
    decoy.verify(
        [
            await decoy_animation_handler.update_started(subsystem=SubSystem.gantry_x),
            await decoy_animation_handler.update_complete(subsystem=SubSystem.gantry_x),
        ],
        times=1,
    )


@pytest.mark.ot3_only
async def test_correct_exception_for_wrong_id(subject: FirmwareUpdateManager) -> None:
    """It uses a custom exception for incorrect ids."""
    with pytest.raises(UpdateIdNotFound):
        subject.get_update_process_handle_by_id("blahblah")


@pytest.mark.ot3_only
async def test_animation_handler(ot3_hardware_api: OT3API, decoy: Decoy) -> None:
    """It sets the lights accordingly."""
    subject = AnimationHandler(hw_handle=ot3_hardware_api)

    # First group of updates:
    #   - UPDATING
    #   - UPDATING again (once rear panel finishes)
    #   - OFF (once finished)
    await subject.update_started(SubSystem.gantry_x)
    await subject.update_started(SubSystem.rear_panel)
    await subject.update_started(SubSystem.gantry_y)

    await subject.update_complete(SubSystem.gantry_x)
    await subject.update_complete(SubSystem.rear_panel)
    await subject.update_complete(SubSystem.gantry_y)

    # Second group of updates - UPDATING and then IDLE
    subject.mark_initialized()
    await subject.update_started(SubSystem.head)
    await subject.update_complete(SubSystem.head)

    decoy.verify(
        [
            # First group
            await ot3_hardware_api.set_status_bar_state(StatusBarState.UPDATING),
            await ot3_hardware_api.set_status_bar_state(StatusBarState.UPDATING),
            await ot3_hardware_api.set_status_bar_state(StatusBarState.OFF),
            await ot3_hardware_api.set_status_bar_state(StatusBarState.UPDATING),
            await ot3_hardware_api.set_status_bar_state(StatusBarState.IDLE),
        ],
        times=1,
    )
