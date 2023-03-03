"""Tests for /instruments routes."""
from __future__ import annotations

from datetime import datetime

import pytest
from typing import TYPE_CHECKING, cast
from decoy import Decoy

from opentrons.calibration_storage.types import CalibrationStatus, SourceType
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.dev_types import PipetteDict, GripperDict
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset,
)
from opentrons.hardware_control.types import (
    GripperJawState,
    OT3Mount,
    InstrumentUpdateStatus,
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
)
from robot_server.instruments.update_progress_monitor import (
    UpdateProgressMonitor,
    UpdateIdNotFound,
)
from robot_server.service.json_api import RequestModel

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.fixture()
def hardware_api(decoy: Decoy) -> HardwareControlAPI:
    """Get a mock hardware control API."""
    return decoy.mock(cls=HardwareControlAPI)


@pytest.fixture
def update_progress_monitor(decoy: Decoy) -> UpdateProgressMonitor:
    """Get a mock UpdateProgressMonitor."""
    return decoy.mock(cls=UpdateProgressMonitor)


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


@pytest.mark.ot3_only
@pytest.fixture
def ot3_hardware_api(decoy: Decoy) -> OT3API:
    """Get a mocked out OT3API."""
    try:
        from opentrons.hardware_control.ot3api import OT3API

        return decoy.mock(cls=OT3API)
    except ImportError:
        return None  # type: ignore[return-value]


# TODO (spp, 2022-01-17): remove xfail once robot server test flow is set up to handle
#  OT2 vs OT3 tests correclty
@pytest.mark.xfail
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


# TODO (spp, 2022-01-17): remove xfail once robot server test flow is set up to handle
#  OT2 vs OT3 tests correclty
@pytest.mark.xfail
@pytest.mark.ot3_only
async def test_get_all_attached_instruments(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
) -> None:
    """It should get data of all attached instruments."""
    decoy.when(ot3_hardware_api.attached_gripper).then_return(
        cast(
            GripperDict,
            {
                "model": GripperModel.v1,
                "fw_version": 123,
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
            },
        )
    )
    decoy.when(ot3_hardware_api.attached_pipettes).then_return(
        {
            Mount.LEFT: get_sample_pipette_dict(
                name="p10_multi",
                model=PipetteModel("abc"),
                pipette_id="my-pipette-id",
                fw_update_required=False,
            ),
            Mount.RIGHT: get_sample_pipette_dict(
                name="p20_multi_gen2",
                model=PipetteModel("xyz"),
                pipette_id="my-other-pipette-id",
                fw_update_required=True,
            ),
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
            firmwareUpdateRequired=False,
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
            firmwareUpdateRequired=False,
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
                fw_update_required=False,
            ),
            Mount.LEFT: cast(PipetteDict, {}),
        }
    )
    result2 = await get_attached_instruments(hardware=hardware_api)
    assert result2.status_code == 200
    assert result2.content.data == [
        Pipette.construct(
            mount="right",
            instrumentType="pipette",
            instrumentName="p20_multi_gen2",
            instrumentModel=PipetteModel("xyz"),
            serialNumber="pipette-id",
            firmwareUpdateRequired=False,
            data=PipetteData(
                channels=1,
                min_volume=1,
                max_volume=1,
            ),
        )
    ]


# TODO (spp, 2022-01-17): remove xfail once robot server test flow is set up to handle
#  OT2 vs OT3 tests correclty
# @pytest.mark.xfail
@pytest.mark.ot3_only
async def test_update_instrument_firmware(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    update_progress_monitor: UpdateProgressMonitor,
) -> None:
    """It should call hardware control's firmware update method and create update resource."""
    update_id = "update-id"
    update_resource_created_at = datetime(year=2023, month=1, day=1)

    expected_update_response = UpdateProgressData(
        id=update_id,
        createdAt=update_resource_created_at,
        mount="left",
        updateStatus=UpdateState.updating,
        updateProgress=42,
    )

    decoy.when(ot3_hardware_api.get_all_attached_instr()).then_return(
        {
            OT3Mount.LEFT: get_sample_pipette_dict(
                name="p10_multi",
                model=PipetteModel("abc"),
                pipette_id="my-pipette-id",
                fw_update_required=True,
            ),
            OT3Mount.RIGHT: get_sample_pipette_dict(
                name="p20_multi_gen2",
                model=PipetteModel("xyz"),
                pipette_id="my-other-pipette-id",
                fw_update_required=False,
            ),
        }
    )
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return(
        {
            OT3Mount.RIGHT: InstrumentUpdateStatus(
                mount=OT3Mount.RIGHT,
                status=UpdateState.updating,
                progress=42,
            ),
        }
    )
    decoy.when(
        update_progress_monitor.create(
            update_id=update_id,
            created_at=update_resource_created_at,
            mount="left",
        )
    ).then_return(expected_update_response)

    update_result = await update_firmware(
        request_body=RequestModel(data=UpdateCreate(mount="left")),
        update_process_id=update_id,
        created_at=update_resource_created_at,
        hardware=ot3_hardware_api,
        update_progress_monitor=update_progress_monitor,
    )

    assert update_result.content.data == expected_update_response
    assert update_result.status_code == 201

    decoy.verify(
        await ot3_hardware_api.cache_instruments(),
        await ot3_hardware_api.update_instrument_firmware(mount=OT3Mount.LEFT),
    )


# TODO (spp, 2022-01-17): remove xfail once robot server test flow is set up to handle
#  OT2 vs OT3 tests correclty
@pytest.mark.xfail
@pytest.mark.ot3_only
async def test_update_instrument_firmware_without_instrument(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    update_progress_monitor: UpdateProgressMonitor,
) -> None:
    """It should raise error when updating a mount with no instrument."""
    update_id = "update-id"
    update_resource_created_at = datetime(year=2023, month=1, day=1)
    decoy.when(ot3_hardware_api.get_all_attached_instr()).then_return(
        {
            OT3Mount.LEFT: None,
            OT3Mount.RIGHT: None,
            OT3Mount.GRIPPER: None,
        }
    )

    with pytest.raises(ApiError) as exc_info:
        await update_firmware(
            request_body=RequestModel(data=UpdateCreate(mount="left")),
            update_process_id=update_id,
            created_at=update_resource_created_at,
            hardware=ot3_hardware_api,
            update_progress_monitor=update_progress_monitor,
        )
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "InstrumentNotFound"


# TODO (spp, 2022-01-17): remove xfail once robot server test flow is set up to handle
#  OT2 vs OT3 tests correclty
@pytest.mark.xfail
@pytest.mark.ot3_only
async def test_update_instrument_firmware_with_conflicting_update(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    update_progress_monitor: UpdateProgressMonitor,
) -> None:
    """It should raise an error when updating an instrument that is already updating."""
    update_id = "update-id"
    update_resource_created_at = datetime(year=2023, month=1, day=1)
    decoy.when(ot3_hardware_api.get_all_attached_instr()).then_return(
        {
            OT3Mount.LEFT: get_sample_pipette_dict(
                name="p10_multi",
                model=PipetteModel("abc"),
                pipette_id="my-pipette-id",
                fw_update_required=True,
            ),
            OT3Mount.RIGHT: None,
            OT3Mount.GRIPPER: None,
        }
    )
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return(
        {
            OT3Mount.LEFT: InstrumentUpdateStatus(
                mount=OT3Mount.LEFT,
                status=UpdateState.updating,
                progress=42,
            ),
        }
    )
    with pytest.raises(ApiError) as exc_info:
        await update_firmware(
            request_body=RequestModel(data=UpdateCreate(mount="left")),
            update_process_id=update_id,
            created_at=update_resource_created_at,
            hardware=ot3_hardware_api,
            update_progress_monitor=update_progress_monitor,
        )
    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "UpdateInProgress"


# TODO (spp, 2022-01-17): remove xfail once robot server test flow is set up to handle
#  OT2 vs OT3 tests correclty
@pytest.mark.xfail
@pytest.mark.ot3_only
async def test_update_instrument_firmware_without_update_available(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    update_progress_monitor: UpdateProgressMonitor,
) -> None:
    """It should raise an error when updating an instrument that has no update available."""
    update_id = "update-id"
    update_resource_created_at = datetime(year=2023, month=1, day=1)
    decoy.when(ot3_hardware_api.get_all_attached_instr()).then_return(
        {
            OT3Mount.LEFT: get_sample_pipette_dict(
                name="p10_multi",
                model=PipetteModel("abc"),
                pipette_id="my-pipette-id",
                fw_update_required=False,
            ),
            OT3Mount.RIGHT: None,
            OT3Mount.GRIPPER: None,
        }
    )
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return({})
    with pytest.raises(ApiError) as exc_info:
        await update_firmware(
            request_body=RequestModel(data=UpdateCreate(mount="left")),
            update_process_id=update_id,
            created_at=update_resource_created_at,
            hardware=ot3_hardware_api,
            update_progress_monitor=update_progress_monitor,
        )
    assert exc_info.value.status_code == 412
    assert exc_info.value.content["errors"][0]["id"] == "NoUpdateAvailable"


# TODO (spp, 2022-01-17): remove xfail once robot server test flow is set up to handle
#  OT2 vs OT3 tests correclty
# @pytest.mark.xfail
@pytest.mark.ot3_only
async def test_get_firmware_update_status(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    update_progress_monitor: UpdateProgressMonitor,
) -> None:
    """It should get firmware update status of specified update process."""
    expected_response = UpdateProgressData(
        id="shiny-new-update-id",
        createdAt=datetime(year=3000, month=12, day=1),
        mount="extension",
        updateStatus=UpdateState.done,
        updateProgress=123,
    )

    decoy.when(update_progress_monitor.get_progress_status("update-id")).then_return(
        expected_response
    )

    update_status = await get_firmware_update_status(
        update_id="update-id",
        update_progress_monitor=update_progress_monitor,
    )

    assert update_status.content.data == expected_response
    assert update_status.status_code == 200


# TODO (spp, 2022-01-17): remove xfail once robot server test flow is set up to handle
#  OT2 vs OT3 tests correclty
# @pytest.mark.xfail
@pytest.mark.ot3_only
async def test_get_firmware_update_status_of_invalid_id(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
    update_progress_monitor: UpdateProgressMonitor,
) -> None:
    """It should raise error when fetching status of an invalid update resource."""
    decoy.when(
        update_progress_monitor.get_progress_status(update_id="imaginary-update-id")
    ).then_raise(UpdateIdNotFound("womp womp.."))

    with pytest.raises(ApiError) as exc_info:
        await get_firmware_update_status(
            update_id="imaginary-update-id",
            update_progress_monitor=update_progress_monitor,
        )
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "InvalidUpdateId"
