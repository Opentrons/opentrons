"""Tests for /instruments routes."""
from __future__ import annotations

from datetime import datetime

import pytest
from typing import TYPE_CHECKING, cast, Optional
from decoy import Decoy, matchers

from opentrons.calibration_storage.types import CalibrationStatus, SourceType
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.dev_types import (
    PipetteDict,
    GripperDict,
)
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset,
)
from opentrons.hardware_control.types import (
    GripperJawState,
    OT3Mount,
    UpdateState,
)
from opentrons.protocol_engine.types import Vec3f
from opentrons.types import Point, Mount
from opentrons_shared_data.gripper.gripper_definition import (
    GripperModelStr,
    GripperModel,
)
from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel
from robot_server.errors import ApiError

from robot_server.instruments.instrument_models import (
    Gripper,
    GripperData,
    Pipette,
    PipetteData,
    GripperCalibrationData,
    UpdateCreate,
    UpdateProgressData,
)
from robot_server.instruments.router import (
    get_attached_instruments,
    update_firmware,
    get_firmware_update_status,
    get_firmware_update_manager,
    UPDATE_CREATE_TIMEOUT_S,
)
from robot_server.instruments.firmware_update_manager import (
    FirmwareUpdateManager,
    UpdateIdNotFound,
    UpdateProcessHandle,
    UpdateProcessSummary,
    UpdateProgress,
    ProcessDetails,
    InstrumentNotFound,
    UpdateInProgress,
    UpdateFailed,
)
from robot_server.service.json_api import RequestModel
from robot_server.service.task_runner import TaskRunner


if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.fixture()
def hardware_api(decoy: Decoy) -> HardwareControlAPI:
    """Get a mock hardware control API."""
    return decoy.mock(cls=HardwareControlAPI)


@pytest.fixture
def task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mocked out TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
def firmware_update_manager(decoy: Decoy) -> FirmwareUpdateManager:
    """Get a mock UpdateProgressMonitor."""
    return decoy.mock(cls=FirmwareUpdateManager)


def get_sample_pipette_dict(
    name: PipetteName,
    model: PipetteModel,
    pipette_id: str,
    fw_update_required: Optional[bool] = None,
    fw_current_version: Optional[int] = None,
    fw_next_version: Optional[int] = None,
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
        "fw_current_version": fw_current_version,
        "fw_next_version": fw_next_version,
    }
    return pipette_dict


@pytest.mark.ot3_only
@pytest.fixture
def ot3_hardware_api(decoy: Decoy) -> OT3API:
    """Get a mocked out OT3API."""
    try:
        from opentrons.hardware_control.ot3api import OT3API

        return decoy.mock(cls=OT3API)
    except ImportError:
        return None  # type: ignore[return-value]


@pytest.mark.ot3_only
async def test_get_instruments_empty(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
) -> None:
    """It should get an empty instruments list from hardware API."""
    decoy.when(ot3_hardware_api.attached_gripper).then_return(None)
    decoy.when(ot3_hardware_api.attached_pipettes).then_return({})
    result = await get_attached_instruments(hardware=ot3_hardware_api)
    assert result.content.data == []
    assert result.status_code == 200


@pytest.mark.ot3_only
async def test_get_all_attached_instruments(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
) -> None:
    """It should get data of all attached instruments."""
    left_pipette_dict = get_sample_pipette_dict(
        name="p10_multi",
        model=PipetteModel("abc"),
        pipette_id="my-pipette-id",
        fw_current_version=123,
        fw_next_version=234,
        fw_update_required=False,
    )
    left_pipette_dict.update({"fw_next_version": 234})
    right_pipette_dict = get_sample_pipette_dict(
        name="p20_multi_gen2",
        model=PipetteModel("xyz"),
        pipette_id="my-other-pipette-id",
        fw_current_version=123,
        fw_next_version=None,
        fw_update_required=True,
    )

    def rehearse_instrument_retrievals() -> None:
        decoy.when(ot3_hardware_api.attached_gripper).then_return(
            cast(
                GripperDict,
                {
                    "model": GripperModel.v1,
                    "fw_current_version": 123,
                    "fw_update_required": True,
                    "gripper_id": "GripperID321",
                    "display_name": "my-special-gripper",
                    "state": GripperJawState.UNHOMED,
                    "calibration_offset": GripperCalibrationOffset(
                        offset=Point(x=1, y=2, z=3),
                        source=SourceType.default,
                        status=CalibrationStatus(markedBad=False),
                        last_modified=None,
                    ),
                    "fw_next_version": None,
                },
            )
        )
        decoy.when(ot3_hardware_api.attached_pipettes).then_return(
            {
                Mount.LEFT: left_pipette_dict,
                Mount.RIGHT: right_pipette_dict,
            }
        )

    # We use this convoluted way of testing to verify the important point that
    # cache_instruments is called before fetching attached pipette and gripper data.
    decoy.when(await ot3_hardware_api.cache_instruments()).then_do(
        rehearse_instrument_retrievals
    )

    decoy.when(ot3_hardware_api.attached_pipettes).then_return(
        {
            Mount.LEFT: left_pipette_dict,
            Mount.RIGHT: right_pipette_dict,
        }
    )
    result = await get_attached_instruments(hardware=ot3_hardware_api)

    assert result.content.data == [
        Pipette.construct(
            mount="left",
            instrumentType="pipette",
            instrumentName="p10_multi",
            instrumentModel=PipetteModel("abc"),
            serialNumber="my-pipette-id",
            currentFirmwareVersion=123,
            firmwareUpdateRequired=False,
            nextAvailableFirmwareVersion=234,
            data=PipetteData(
                channels=1,
                min_volume=1,
                max_volume=1,
            ),
        ),
        Pipette.construct(
            mount="right",
            instrumentType="pipette",
            instrumentName="p20_multi_gen2",
            instrumentModel=PipetteModel("xyz"),
            serialNumber="my-other-pipette-id",
            currentFirmwareVersion=123,
            firmwareUpdateRequired=True,
            nextAvailableFirmwareVersion=None,
            data=PipetteData(
                channels=1,
                min_volume=1,
                max_volume=1,
            ),
        ),
        Gripper.construct(
            mount="extension",
            instrumentType="gripper",
            instrumentModel=GripperModelStr("gripperV1"),
            serialNumber="GripperID321",
            currentFirmwareVersion=123,
            firmwareUpdateRequired=True,
            data=GripperData(
                jawState="unhomed",
                calibratedOffset=GripperCalibrationData(
                    offset=Vec3f(x=1, y=2, z=3),
                    source=SourceType.default,
                    last_modified=None,
                ),
            ),
        ),
    ]


async def test_get_ot2_instruments(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
) -> None:
    """It should return attached pipettes on OT2."""
    # Return empty data when no pipettes attached
    decoy.when(hardware_api.attached_instruments).then_return({})
    result1 = await get_attached_instruments(hardware=hardware_api)
    assert result1.content.data == []
    assert result1.status_code == 200

    # Return attached pipettes
    decoy.when(hardware_api.attached_instruments).then_return(
        {
            Mount.RIGHT: get_sample_pipette_dict(
                name="p20_multi_gen2",
                model=PipetteModel("xyz"),
                pipette_id="pipette-id",
            ),
            Mount.LEFT: cast(PipetteDict, {}),
        }
    )
    result2 = await get_attached_instruments(hardware=hardware_api)
    decoy.verify(await hardware_api.cache_instruments(), times=0)
    assert result2.status_code == 200
    assert result2.content.data == [
        Pipette.construct(
            mount="right",
            instrumentType="pipette",
            instrumentName="p20_multi_gen2",
            instrumentModel=PipetteModel("xyz"),
            serialNumber="pipette-id",
            currentFirmwareVersion=None,
            firmwareUpdateRequired=None,
            nextAvailableFirmwareVersion=None,
            data=PipetteData(
                channels=1,
                min_volume=1,
                max_volume=1,
            ),
        )
    ]


def get_good_start_status(
    mount: OT3Mount, update_id: str, created: datetime
) -> UpdateProcessSummary:
    """Utility function to set up what an update process should return."""
    return UpdateProcessSummary(
        details=ProcessDetails(created_at=created, mount=mount, update_id=update_id),
        progress=UpdateProgress(state=UpdateState.updating, progress=10),
    )


async def decoy_ok_fw_update_start(
    decoy: Decoy,
    firmware_update_manager: FirmwareUpdateManager,
    update_id: str,
    mount: OT3Mount,
    created_at: datetime,
    start_timeout_s: float,
    first_summary: UpdateProcessSummary,
) -> UpdateProcessHandle:
    """Utility function to set up a properly-started update process."""
    uph_decoy = decoy.mock(cls=UpdateProcessHandle)
    decoy.when(
        await firmware_update_manager.start_update_process(
            update_id, mount, created_at, start_timeout_s
        )
    ).then_return(uph_decoy)
    decoy.when(await uph_decoy.get_process_summary()).then_return(first_summary)
    return uph_decoy


@pytest.mark.ot3_only
async def test_update_instrument_firmware(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    firmware_update_manager: FirmwareUpdateManager,
    task_runner: TaskRunner,
) -> None:
    """It should call start an update in the firmware update manager."""
    update_id = "update-id"
    update_resource_created_at = datetime(year=2023, month=1, day=1)
    expected_status = get_good_start_status(
        OT3Mount.LEFT, "update-id", update_resource_created_at
    )
    expected_update_response = UpdateProgressData(
        id=update_id,
        createdAt=update_resource_created_at,
        mount="left",
        updateStatus=expected_status.progress.state,
        updateProgress=expected_status.progress.progress,
    )
    _ = await decoy_ok_fw_update_start(
        decoy,
        firmware_update_manager,
        update_id,
        OT3Mount.LEFT,
        update_resource_created_at,
        UPDATE_CREATE_TIMEOUT_S,
        get_good_start_status(OT3Mount.LEFT, update_id, update_resource_created_at),
    )

    update_result = await update_firmware(
        request_body=RequestModel(data=UpdateCreate(mount="left")),
        update_process_id=update_id,
        created_at=update_resource_created_at,
        hardware=ot3_hardware_api,
        firmware_update_manager=firmware_update_manager,
    )

    assert update_result.content.data == expected_update_response
    assert update_result.status_code == 201

    decoy.verify(
        await ot3_hardware_api.cache_instruments(),
        await firmware_update_manager.start_update_process(
            update_id,
            OT3Mount.LEFT,
            update_resource_created_at,
            UPDATE_CREATE_TIMEOUT_S,
        ),
    )


@pytest.mark.ot3_only
async def test_update_instrument_firmware_times_out(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    firmware_update_manager: FirmwareUpdateManager,
) -> None:
    """It should raise an UpdateInfoNotAvailable error when timed out trying to fetch status."""
    update_id = "update-id"
    update_resource_created_at = datetime(year=2023, month=1, day=1)
    decoy.when(
        await firmware_update_manager.start_update_process(
            update_id,
            OT3Mount.LEFT,
            update_resource_created_at,
            UPDATE_CREATE_TIMEOUT_S,
        )
    ).then_raise(TimeoutError())
    decoy.when(
        await firmware_update_manager.complete_update_process("update-id")
    ).then_return(None)

    with pytest.raises(ApiError) as exc_info:
        await update_firmware(
            request_body=RequestModel(data=UpdateCreate(mount="left")),
            update_process_id=update_id,
            created_at=update_resource_created_at,
            hardware=ot3_hardware_api,
            firmware_update_manager=firmware_update_manager,
        )
    assert exc_info.value.status_code == 408
    assert exc_info.value.content["errors"][0]["id"] == "TimeoutStartingUpdate"
    decoy.verify(
        await firmware_update_manager.complete_update_process(update_id),
    )


@pytest.mark.ot3_only
async def test_update_instrument_firmware_without_instrument(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    firmware_update_manager: FirmwareUpdateManager,
) -> None:
    """It should raise error when updating a mount with no instrument."""
    update_id = "update-id"
    update_resource_created_at = datetime(year=2023, month=1, day=1)

    decoy.when(
        await firmware_update_manager.start_update_process(
            matchers.Anything(),
            matchers.Anything(),
            matchers.Anything(),
            matchers.Anything(),
        ),
    ).then_raise(InstrumentNotFound())
    with pytest.raises(ApiError) as exc_info:
        await update_firmware(
            request_body=RequestModel(data=UpdateCreate(mount="left")),
            update_process_id=update_id,
            created_at=update_resource_created_at,
            hardware=ot3_hardware_api,
            firmware_update_manager=firmware_update_manager,
        )
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "InstrumentNotFound"


@pytest.mark.ot3_only
async def test_update_instrument_firmware_with_conflicting_update(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    firmware_update_manager: FirmwareUpdateManager,
) -> None:
    """It should raise an error when updating an instrument that is already updating."""
    update_id = "update-id"
    update_resource_created_at = datetime(year=2023, month=1, day=1)
    decoy.when(
        firmware_update_manager.start_update_process(
            matchers.Anything(),
            matchers.Anything(),
            matchers.Anything(),
            matchers.Anything(),
        )
    ).then_raise(UpdateInProgress())
    with pytest.raises(ApiError) as exc_info:
        await update_firmware(
            request_body=RequestModel(data=UpdateCreate(mount="left")),
            update_process_id=update_id,
            created_at=update_resource_created_at,
            hardware=ot3_hardware_api,
            firmware_update_manager=firmware_update_manager,
        )
    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "UpdateInProgress"


@pytest.mark.ot3_only
async def test_update_task_immediate_failure(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    firmware_update_manager: FirmwareUpdateManager,
) -> None:
    """It should call hardware control's firmware update method and create update resource."""
    update_id = "update-id"
    update_resource_created_at = datetime(year=2023, month=1, day=1)

    decoy.when(
        firmware_update_manager.start_update_process(
            matchers.Anything(),
            matchers.Anything(),
            matchers.Anything(),
            matchers.Anything(),
        )
    ).then_raise(UpdateFailed())

    with pytest.raises(ApiError) as exc_info:
        await update_firmware(
            request_body=RequestModel(data=UpdateCreate(mount="left")),
            update_process_id=update_id,
            created_at=update_resource_created_at,
            hardware=ot3_hardware_api,
            firmware_update_manager=firmware_update_manager,
        )
    assert exc_info.value.status_code == 500
    assert exc_info.value.content["errors"][0]["id"] == "FirmwareUpdateFailed"


@pytest.mark.ot3_only
async def test_get_firmware_update_status(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    firmware_update_manager: FirmwareUpdateManager,
) -> None:
    """It should get firmware update status of specified update process."""
    expected_response = UpdateProgressData(
        id="shiny-new-update-id",
        createdAt=datetime(year=3000, month=12, day=1),
        mount="extension",
        updateStatus=UpdateState.done,
        updateProgress=123,
    )
    handle = decoy.mock(cls=UpdateProcessHandle)

    decoy.when(
        firmware_update_manager.get_update_process_handle("shiny-new-update-id")
    ).then_return(handle)
    decoy.when(await handle.get_process_summary()).then_return(
        UpdateProcessSummary(
            details=ProcessDetails(
                created_at=datetime(year=3000, month=12, day=1),
                mount=OT3Mount.GRIPPER,
                update_id="shiny-new-update-id",
            ),
            progress=UpdateProgress(state=UpdateState.done, progress=123),
        )
    )

    update_status = await get_firmware_update_status(
        update_id="shiny-new-update-id", firmware_update_manager=firmware_update_manager
    )

    assert update_status.content.data == expected_response
    assert update_status.status_code == 200


@pytest.mark.ot3_only
async def test_get_firmware_update_status_of_wrong_id(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    firmware_update_manager: FirmwareUpdateManager,
) -> None:
    """It should raise error when fetching status of an invalid update resource."""
    decoy.when(
        firmware_update_manager.get_update_process_handle("imaginary-update-id")
    ).then_raise(UpdateIdNotFound("womp womp..."))

    with pytest.raises(ApiError) as exc_info:
        await get_firmware_update_status(
            update_id="imaginary-update-id",
            firmware_update_manager=firmware_update_manager,
        )
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "IDNotFound"


@pytest.mark.ot3_only
async def test_get_firmware_update_manager_is_singleton(
    ot3_hardware_api: OT3API,
) -> None:
    """It should return the same instance of UpdateProgressMonitor in multiple calls."""
    manager1 = await get_firmware_update_manager(hardware_api=ot3_hardware_api)
    manager2 = await get_firmware_update_manager(hardware_api=ot3_hardware_api)

    assert manager1 is manager2
