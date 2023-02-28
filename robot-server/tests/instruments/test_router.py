"""Tests for /instruments routes."""
from __future__ import annotations

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

from robot_server.instruments.instrument_models import (
    Gripper,
    GripperData,
    Pipette,
    PipetteData,
    GripperCalibrationData,
    UpdateRequestModel,
    MountTypesStr,
    UpdateProgressStatus,
    UpdateStatusLink,
)
from robot_server.instruments.router import (
    get_attached_instruments,
    update_firmware,
    get_firmware_update_status,
)
from robot_server.service.json_api import RequestModel, ResourceLink

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


@pytest.fixture()
def hardware_api(decoy: Decoy) -> HardwareControlAPI:
    """Get a mock hardware control API."""
    return decoy.mock(cls=HardwareControlAPI)


def get_sample_pipette_dict(
    name: PipetteName,
    model: PipetteModel,
    pipette_id: str,
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
        "fw_version": 123,
        "fw_update_required": False,
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
            ),
            Mount.RIGHT: get_sample_pipette_dict(
                name="p20_multi_gen2",
                model=PipetteModel("xyz"),
                pipette_id="my-other-pipette-id",
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
@pytest.mark.xfail
@pytest.mark.ot3_only
async def test_update_instrument_firmware(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
) -> None:
    """It should call hardware control's firmware update method."""
    one_instrument_result = await update_firmware(
        request_body=RequestModel(
            data=UpdateRequestModel(mount=cast(MountTypesStr, "left"))
        ),
        hardware=ot3_hardware_api,
    )
    assert one_instrument_result.content.links == UpdateStatusLink(
        updateStatus=ResourceLink(href="/instruments/update/status")
    )
    assert one_instrument_result.status_code == 200
    decoy.verify(
        await ot3_hardware_api.update_instrument_firmware(mounts={OT3Mount.LEFT})
    )

    all_instruments_result = await update_firmware(
        request_body=RequestModel(data=None),
        hardware=ot3_hardware_api,
    )
    assert all_instruments_result.content.links == UpdateStatusLink(
        updateStatus=ResourceLink(href="/instruments/update/status")
    )
    assert all_instruments_result.status_code == 200
    decoy.verify(await ot3_hardware_api.update_instrument_firmware(mounts=None))


# TODO (spp, 2022-01-17): remove xfail once robot server test flow is set up to handle
#  OT2 vs OT3 tests correclty
@pytest.mark.xfail
@pytest.mark.ot3_only
async def test_get_firmware_update_status(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
) -> None:
    """It should get firmware update status of all attached instruments."""
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return(
        {
            OT3Mount.LEFT: InstrumentUpdateStatus(
                mount=OT3Mount.LEFT,
                status=UpdateState.updating,
                progress=75,
            ),
            OT3Mount.GRIPPER: InstrumentUpdateStatus(
                mount=OT3Mount.GRIPPER,
                status=UpdateState.done,
                progress=100,
            ),
        }
    )
    result = await get_firmware_update_status(hardware=ot3_hardware_api)
    assert result.content.data == [
        UpdateProgressStatus.construct(
            mount="left",
            updateStatus="updating",
            updateProgress=75,
        ),
        UpdateProgressStatus.construct(
            mount="extension",
            updateStatus="done",
            updateProgress=100,
        ),
    ]
