"""Tests for /subsystems routes."""
from datetime import datetime
from typing import Set, Dict
from fastapi import Response, Request
from starlette.datastructures import URL, MutableHeaders

import pytest
from decoy import Decoy, matchers

from robot_server.service.task_runner import TaskRunner
from robot_server.subsystems.models import (
    UpdateState,
    UpdateProgressData,
    SubSystem,
    UpdateProgressSummary,
    PresentSubsystem,
)
from robot_server.subsystems.firmware_update_manager import (
    UpdateProcessHandle,
    ProcessDetails,
    UpdateProgress,
    FirmwareUpdateManager,
    NoOngoingUpdate as NoOngoingUpdateExc,
    UpdateFailed as UpdateFailedExc,
    UpdateIdNotFound as UpdateIdNotFoundExc,
    UpdateIdExists as UpdateIdExistsExc,
    UncontrolledUpdateInProgress as UncontrolledUpdateInProgressExc,
    UpdateInProgress as UpdateInProgressExc,
    SubsystemNotFound as SubsystemNotFoundExc,
)

from robot_server.subsystems.router import (
    UPDATE_CREATE_TIMEOUT_S,
    begin_subsystem_update,
    get_update_process,
    get_update_processes,
    get_subsystem_update,
    get_subsystem_updates,
    get_attached_subsystem,
    get_attached_subsystems,
    NoOngoingUpdate,
    InvalidSubsystem,
    SubsystemNotPresent,
    FirmwareUpdateFailed,
    TimeoutStartingUpdate,
    UpdateInProgress,
    NoUpdateAvailable,
    get_ot3_hardware,
    get_firmware_update_manager,
)
from robot_server.errors.robot_errors import NotSupportedOnOT2
from robot_server.errors.global_errors import IDNotFound
from robot_server.errors import ApiError

from opentrons.hardware_control.types import (
    OT3Mount,
    SubSystem as HWSubSystem,
    SubSystemState,
    UpdateState as HWUpdateState,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.api import API


@pytest.fixture
def update_manager(decoy: Decoy) -> FirmwareUpdateManager:
    return decoy.mock(cls=FirmwareUpdateManager)


@pytest.fixture()
def hardware_api(decoy: Decoy) -> OT3API:
    return decoy.mock(cls=OT3API)


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


@pytest.mark.parametrize(
    "subsystems",
    [
        ({HWSubSystem.gantry_x, HWSubSystem.gantry_y, HWSubSystem.head},),
        ({HWSubSystem.gantry_x, HWSubSystem.pipette_left, HWSubSystem.gripper}),
        ({},),
    ],
)
async def test_get_attached_subsystems(
    hardware_api: OT3API, subsystems: Set[HWSubSystem], decoy: Decoy
) -> None:
    decoy.when(hardware_api.attached_subsystems).then_return(
        _build_attached_subsystems(subsystems)
    )
    resp = await get_attached_subsystems(hardware_api)


@pytest.mark.parametrize(
    "subsystem",
    [
        (SubSystem.gantry_x,),
        (SubSystem.pipette_left,),
        (SubSystem.motor_controller_board,),
    ],
)
async def test_get_attached_subsystem(
    hardware_api: OT3API, subsystem: SubSystem, decoy: Decoy
) -> None:
    status = _build_attached_subsystem(subsystem.to_hw())
    decoy.when(hardware_api.attached_subsystems.get(subsystem.to_hw())).then_return(
        status
    )
    response = await get_attached_subsystem(subsystem, hardware_api)
    assert response.status_code == 200
    assert response.content.data == PresentSubsystem(
        name=subsystem,
        ok=status.ok,
        current_fw_version=str(status.current_fw_version),
        next_fw_version=str(status.next_fw_version),
        fw_update_needed=status.fw_update_needed,
        revision=status.pcba_revision,
    )


async def test_get_attached_subsystem_handles_not_present_subsystem(
    hardware_api: OT3API, decoy: Decoy
) -> None:
    decoy.when(hardware_api.attached_subsystems).then_return({})
    with pytest.raises(ApiError) as exc_info:
        await get_attached_subsystem(SubSystem.gantry_x, hardware_api)
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "SubsystemNotPresent"


async def test_get_subsystem_updates_with_some(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    x_process_details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=SubSystem.gantry_x,
        update_id="mock-update-id-1",
    )
    y_process_details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=SubSystem.gantry_y,
        update_id="mock-update-id-2",
    )
    head_process_details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=SubSystem.head,
        update_id="mock-update-succeeded",
    )
    pipette_process_details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=SubSystem.pipette_left,
        update_id="mock-update-failed",
    )
    x_state = UpdateState.updating
    y_state = UpdateState.queued
    head_state = UpdateState.done
    pipette_state = UpdateState.failed

    gantry_x_handler = decoy.mock(cls=UpdateProcessHandle)
    gantry_y_handler = decoy.mock(cls=UpdateProcessHandle)
    head_handler = decoy.mock(cls=UpdateProcessHandle)
    pipette_handler = decoy.mock(cls=UpdateProcessHandle)
    decoy.when(gantry_x_handler.process_details).then_return(x_process_details)
    decoy.when(gantry_y_handler.process_details).then_return(y_process_details)
    decoy.when(head_handler.process_details).then_return(head_process_details)
    decoy.when(pipette_handler.process_details).then_return(pipette_process_details)
    decoy.when(gantry_x_handler.cached_state).then_return(x_state)
    decoy.when(gantry_y_handler.cached_state).then_return(y_state)
    decoy.when(head_handler.cached_state).then_return(head_state)
    decoy.when(pipette_handler.cached_state).then_return(pipette_state)

    decoy.when(await update_manager.all_ongoing_processes()).then_return(
        [gantry_x_handler, gantry_y_handler, head_handler, pipette_handler]
    )

    response = await get_subsystem_updates(update_manager)
    assert response.content.data == [
        UpdateProgressSummary.construct(
            id=x_process_details.update_id,
            createdAt=x_process_details.created_at,
            subsystem=x_process_details.subsystem,
            updateStatus=x_state,
        ),
        UpdateProgressSummary.construct(
            id=y_process_details.update_id,
            createdAt=y_process_details.created_at,
            subsystem=y_process_details.subsystem,
            updateStatus=y_state,
        ),
        UpdateProgressSummary.construct(
            id=head_process_details.update_id,
            createdAt=head_process_details.created_at,
            subsystem=head_process_details.subsystem,
            updateStatus=head_state,
        ),
        UpdateProgressSummary.construct(
            id=pipette_process_details.update_id,
            createdAt=pipette_process_details.created_at,
            subsystem=pipette_process_details.subsystem,
            updateStatus=pipette_state,
        ),
    ]


async def test_get_subsystem_updates_with_none(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    decoy.when(await update_manager.all_ongoing_processes()).then_return([])
    response = await get_subsystem_updates(update_manager)
    assert response.content.data == []


async def test_get_subsystem_update_succeeds(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    subsystem = SubSystem.gantry_x
    handle = decoy.mock(cls=UpdateProcessHandle)
    details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=subsystem,
        update_id="some-update-id",
    )
    progress = UpdateProgress(state=UpdateState.updating, progress=34, error=None)
    decoy.when(handle.process_details).then_return(details)
    decoy.when(await handle.get_progress()).then_return(progress)
    decoy.when(
        await update_manager.get_ongoing_update_process_handle_by_subsystem(subsystem)
    ).then_return(handle)
    response = await get_subsystem_update(subsystem, update_manager)
    assert response.content.data == UpdateProgressData.construct(
        id=details.update_id,
        createdAt=details.created_at,
        subsystem=details.subsystem,
        updateStatus=progress.state,
        updateProgress=progress.progress,
        updateError=None,
    )


async def test_get_subsystem_update_not_present(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    decoy.when(
        await update_manager.get_ongoing_update_process_handle_by_subsystem(
            SubSystem.gantry_x
        )
    ).then_raise(NoOngoingUpdateExc())
    with pytest.raises(ApiError) as exc_info:
        await get_subsystem_update(SubSystem.gantry_x, update_manager)
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "NoOngoingUpdate"


async def test_get_subsystem_update_error(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    subsystem = SubSystem.gantry_x
    handle = decoy.mock(cls=UpdateProcessHandle)
    details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=subsystem,
        update_id="some-update-id",
    )
    progress = UpdateProgress(
        state=UpdateState.failed, progress=27, error=RuntimeError("oh no!")
    )
    decoy.when(handle.process_details).then_return(details)
    decoy.when(await handle.get_progress()).then_return(progress)
    decoy.when(
        await update_manager.get_ongoing_update_process_handle_by_subsystem(subsystem)
    ).then_return(handle)
    response = await get_subsystem_update(subsystem, update_manager)
    assert response.content.data == UpdateProgressData.construct(
        id=details.update_id,
        createdAt=details.created_at,
        subsystem=details.subsystem,
        updateProgress=progress.progress,
        updateStatus=progress.state,
        updateError="RuntimeError",
    )


async def test_get_all_updates_some(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    x_process_details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=SubSystem.gantry_x,
        update_id="mock-update-id-1",
    )
    y_process_details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=SubSystem.gantry_y,
        update_id="mock-update-id-2",
    )
    head_process_details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=SubSystem.head,
        update_id="mock-update-succeeded",
    )
    pipette_process_details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=SubSystem.pipette_left,
        update_id="mock-update-failed",
    )
    x_state = UpdateState.updating
    y_state = UpdateState.queued
    head_state = UpdateState.done
    pipette_state = UpdateState.failed

    gantry_x_handler = decoy.mock(cls=UpdateProcessHandle)
    gantry_y_handler = decoy.mock(cls=UpdateProcessHandle)
    head_handler = decoy.mock(cls=UpdateProcessHandle)
    pipette_handler = decoy.mock(cls=UpdateProcessHandle)
    decoy.when(gantry_x_handler.process_details).then_return(x_process_details)
    decoy.when(gantry_y_handler.process_details).then_return(y_process_details)
    decoy.when(head_handler.process_details).then_return(head_process_details)
    decoy.when(pipette_handler.process_details).then_return(pipette_process_details)
    decoy.when(gantry_x_handler.cached_state).then_return(x_state)
    decoy.when(gantry_y_handler.cached_state).then_return(y_state)
    decoy.when(head_handler.cached_state).then_return(head_state)
    decoy.when(pipette_handler.cached_state).then_return(pipette_state)

    decoy.when(update_manager.all_update_processes()).then_return(
        [gantry_x_handler, gantry_y_handler, head_handler, pipette_handler]
    )
    response = await get_update_processes(update_manager)
    assert response.content.data == [
        UpdateProgressSummary.construct(
            id=x_process_details.update_id,
            createdAt=x_process_details.created_at,
            subsystem=x_process_details.subsystem,
            updateStatus=x_state,
        ),
        UpdateProgressSummary.construct(
            id=y_process_details.update_id,
            createdAt=y_process_details.created_at,
            subsystem=y_process_details.subsystem,
            updateStatus=y_state,
        ),
        UpdateProgressSummary.construct(
            id=head_process_details.update_id,
            createdAt=head_process_details.created_at,
            subsystem=head_process_details.subsystem,
            updateStatus=head_state,
        ),
        UpdateProgressSummary.construct(
            id=pipette_process_details.update_id,
            createdAt=pipette_process_details.created_at,
            subsystem=pipette_process_details.subsystem,
            updateStatus=pipette_state,
        ),
    ]


async def test_get_all_updates_none(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    decoy.when(update_manager.all_update_processes()).then_return([])
    response = await get_update_processes(update_manager)
    assert response.content.data == []


async def test_get_update_process(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    mock_id = "some-fake-id"
    x_process_details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=SubSystem.gantry_x,
        update_id="mock-update-id-1",
    )
    x_progress = UpdateProgress(state=UpdateState.updating, progress=25, error=None)
    gantry_x_handler = decoy.mock(cls=UpdateProcessHandle)
    decoy.when(gantry_x_handler.process_details).then_return(x_process_details)
    decoy.when(await gantry_x_handler.get_progress()).then_return(x_progress)
    decoy.when(update_manager.get_update_process_handle_by_id(mock_id)).then_return(
        gantry_x_handler
    )
    response = await get_update_process(mock_id, update_manager)
    assert response.content.data == UpdateProgressData(
        id=mock_id,
        createdAt=x_process_details.created_at,
        subsystem=x_process_details.subsystem,
        updateStatus=x_progress.state,
        updateProgress=x_progress.progress,
        updateError=None,
    )


async def test_get_update_process_error(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    mock_id = "some-fake-id"
    x_process_details = ProcessDetails(
        created_at=datetime.now(),
        subsystem=SubSystem.gantry_x,
        update_id="mock-update-id-1",
    )
    x_progress = UpdateProgress(
        state=UpdateState.failed, progress=27, error=RuntimeError("oh no!")
    )
    gantry_x_handler = decoy.mock(cls=UpdateProcessHandle)
    decoy.when(gantry_x_handler.process_details).then_return(x_process_details)
    decoy.when(await gantry_x_handler.get_progress()).then_return(x_progress)
    decoy.when(update_manager.get_update_process_handle_by_id(mock_id)).then_return(
        gantry_x_handler
    )
    response = await get_update_process(mock_id, update_manager)
    assert response.content.data == UpdateProgressData(
        id=mock_id,
        createdAt=x_process_details.created_at,
        subsystem=x_process_details.subsystem,
        updateStatus=x_progress.state,
        updateProgress=x_progress.progress,
        updateError="RuntimeError",
    )


async def test_get_update_process_rejects_bad_id(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    mock_id = "some-fake-id"
    decoy.when(update_manager.get_update_process_handle_by_id(mock_id)).then_raise(
        UpdateIdNotFoundExc()
    )
    with pytest.raises(ApiError) as exc_info:
        await get_update_process(mock_id, update_manager)
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "IDNotFound"


async def test_begin_update(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    request = decoy.mock(cls=Request)
    response = decoy.mock(cls=Response)
    subsystem = SubSystem.gantry_x
    url = URL("http://127.0.0.1:31950/subsystems/updates")
    decoy.when(request.url).then_return(url)
    headers = MutableHeaders()
    decoy.when(response.headers).then_return(headers)

    update_id = "some-id"
    created_at = datetime.now()
    details = ProcessDetails(
        created_at=created_at, subsystem=subsystem, update_id=update_id
    )
    progress = UpdateProgress(state=UpdateState.queued, progress=0, error=None)
    mock_handle = decoy.mock(cls=UpdateProcessHandle)
    decoy.when(await mock_handle.get_progress()).then_return(progress)
    decoy.when(mock_handle.process_details).then_return(details)
    decoy.when(
        await update_manager.start_update_process(
            update_id, subsystem, created_at, UPDATE_CREATE_TIMEOUT_S
        )
    ).then_return(mock_handle)

    response_data = await begin_subsystem_update(
        subsystem, response, request, update_manager, update_id, created_at
    )
    assert (
        headers["Location"]
        == f"http:127.0.0.1:31950/subsystems/updates/current/{subsystem.value}"
    )
    assert response_data.content.data == UpdateProgressData.construct(
        id=update_id,
        createdAt=created_at,
        subsystem=subsystem,
        updateStatus=progress.state,
        updateProgress=progress.progress,
        updateError=None,
    )


async def test_begin_update_subsystem_not_found(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    request = decoy.mock(cls=Request)
    response = decoy.mock(cls=Response)
    subsystem = SubSystem.gantry_x

    update_id = "some-id"
    created_at = datetime.now()
    decoy.when(
        await update_manager.start_update_process(
            update_id, subsystem, created_at, UPDATE_CREATE_TIMEOUT_S
        )
    ).then_raise(SubsystemNotFoundExc(subsystem))
    with pytest.raises(ApiError) as exc_info:
        await begin_subsystem_update(
            subsystem, response, request, update_manager, update_id, created_at
        )
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "SubsystemNotPresent"


async def test_begin_update_update_in_progress(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    request = decoy.mock(cls=Request)
    response = decoy.mock(cls=Response)
    url = URL("http://127.0.0.1:31950/subsystems/updates")
    subsystem = SubSystem.gantry_x
    headers = MutableHeaders()
    decoy.when(request.url).then_return(url)
    decoy.when(response.headers).then_return(headers)

    update_id = "some-id"
    created_at = datetime.now()
    decoy.when(
        await update_manager.start_update_process(
            update_id, subsystem, created_at, UPDATE_CREATE_TIMEOUT_S
        )
    ).then_raise(UpdateInProgressExc(subsystem))
    with pytest.raises(ApiError) as exc_info:
        await begin_subsystem_update(
            subsystem, response, request, update_manager, update_id, created_at
        )
    assert exc_info.value.status_code == 303
    assert exc_info.value.content["errors"][0]["id"] == "UpdateInProgress"
    assert (
        headers["Location"]
        == f"http://127.0.0.1:31950/subsystems/updates/current/{subsystem.name}"
    )


async def test_begin_update_timeout(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    request = decoy.mock(cls=Request)
    response = decoy.mock(cls=Response)
    subsystem = SubSystem.gantry_x

    update_id = "some-id"
    created_at = datetime.now()
    decoy.when(
        await update_manager.start_update_process(
            update_id, subsystem, created_at, UPDATE_CREATE_TIMEOUT_S
        )
    ).then_raise(TimeoutError())
    with pytest.raises(ApiError) as exc_info:
        await begin_subsystem_update(
            subsystem, response, request, update_manager, update_id, created_at
        )
    assert exc_info.value.status_code == 408
    assert exc_info.value.content["errors"][0]["id"] == "TimeoutStartingUpdate"


async def test_begin_update_id_exists(
    update_manager: FirmwareUpdateManager, decoy: Decoy
) -> None:
    response = decoy.mock(cls=Response)
    request = decoy.mock(cls=Request)
    subsystem = SubSystem.gantry_x

    update_id = "some-id"
    created_at = datetime.now()
    decoy.when(
        await update_manager.start_update_process(
            update_id, subsystem, created_at, UPDATE_CREATE_TIMEOUT_S
        )
    ).then_raise(UpdateIdExistsExc())
    with pytest.raises(ApiError) as exc_info:
        await begin_subsystem_update(
            subsystem, response, request, update_manager, update_id, created_at
        )
    assert exc_info.value.status_code == 500
    assert exc_info.value.content["errors"][0]["id"] == "UpdateInProgress"
