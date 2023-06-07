"""Tests for /instruments routes."""
from __future__ import annotations

import pytest
from typing import TYPE_CHECKING, cast
from decoy import Decoy

from opentrons.calibration_storage.types import CalibrationStatus, SourceType
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset,
    PipetteOffsetByPipetteMount,
)
from opentrons.hardware_control.types import GripperJawState, OT3Mount
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
    InstrumentCalibrationData,
)
from robot_server.instruments.router import get_attached_instruments

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


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


# TODO (spp, 2022-01-17): remove xfail once robot server test flow is set up to handle
#  OT2 vs OT3 tests correclty
@pytest.mark.ot3_only
async def test_get_all_attached_instruments(
    decoy: Decoy,
    ot3_hardware_api: OT3API,
) -> None:
    """It should get data of all attached instruments."""

    def rehearse_instrument_retrievals() -> None:
        decoy.when(ot3_hardware_api.attached_gripper).then_return(
            {
                "model": GripperModel.v1,
                "gripper_id": "GripperID321",
                "display_name": "my-special-gripper",
                "state": GripperJawState.UNHOMED,
                "calibration_offset": GripperCalibrationOffset(
                    offset=Point(x=1, y=2, z=3),
                    source=SourceType.default,
                    status=CalibrationStatus(markedBad=False),
                    last_modified=None,
                ),
                "fw_update_required": False,
                "fw_current_version": 1,
                "fw_next_version": None,
            }
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

    # We use this convoluted way of testing to verify the important point that
    # cache_instruments is called before fetching attached pipette and gripper data.
    decoy.when(await ot3_hardware_api.cache_instruments()).then_do(
        rehearse_instrument_retrievals
    )
    decoy.when(ot3_hardware_api.get_instrument_offset(mount=OT3Mount.LEFT)).then_return(
        PipetteOffsetByPipetteMount(
            offset=Point(1, 2, 3),
            source=SourceType.default,
            status=CalibrationStatus(),
            last_modified=None,
        )
    )
    decoy.when(
        ot3_hardware_api.get_instrument_offset(mount=OT3Mount.RIGHT)
    ).then_return(
        PipetteOffsetByPipetteMount(
            offset=Point(4, 5, 6),
            source=SourceType.default,
            status=CalibrationStatus(),
            last_modified=None,
        )
    )
    result = await get_attached_instruments(hardware=ot3_hardware_api)

    assert result.content.data == [
        Pipette.construct(
            mount="left",
            instrumentType="pipette",
            instrumentName="p10_multi",
            instrumentModel=PipetteModel("abc"),
            serialNumber="my-pipette-id",
            data=PipetteData(
                channels=1,
                min_volume=1,
                max_volume=1,
                calibratedOffset=InstrumentCalibrationData(
                    offset=Vec3f(x=1, y=2, z=3),
                    source=SourceType.default,
                    last_modified=None,
                ),
            ),
        ),
        Pipette.construct(
            mount="right",
            instrumentType="pipette",
            instrumentName="p20_multi_gen2",
            instrumentModel=PipetteModel("xyz"),
            serialNumber="my-other-pipette-id",
            data=PipetteData(
                channels=1,
                min_volume=1,
                max_volume=1,
                calibratedOffset=InstrumentCalibrationData(
                    offset=Vec3f(x=4, y=5, z=6),
                    source=SourceType.default,
                    last_modified=None,
                ),
            ),
        ),
        Gripper.construct(
            mount="extension",
            instrumentType="gripper",
            instrumentModel=GripperModelStr("gripperV1"),
            serialNumber="GripperID321",
            data=GripperData(
                jawState="unhomed",
                calibratedOffset=InstrumentCalibrationData(
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
            data=PipetteData(
                channels=1,
                min_volume=1,
                max_volume=1,
            ),
        )
    ]


async def test_get_96_channel_instruments(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
) -> None:
    """It should correctly be able to construct a 96 channel pipette."""
    # Return attached pipettes
    decoy.when(hardware_api.attached_instruments).then_return(
        {
            Mount.LEFT: {  # type: ignore [typeddict-item]
                "name": "p1000_96",
                "model": PipetteModel("xyz"),
                "pipette_id": "pipette-id",
                "back_compat_names": [],
                "min_volume": 1,
                "max_volume": 1000,
                "channels": 96,
            },
            Mount.RIGHT: cast(PipetteDict, {}),
        }
    )
    result2 = await get_attached_instruments(hardware=hardware_api)
    decoy.verify(await hardware_api.cache_instruments(), times=0)
    assert result2.status_code == 200
    assert result2.content.data == [
        Pipette.construct(
            mount="left",
            instrumentType="pipette",
            instrumentName="p1000_96",
            instrumentModel=PipetteModel("xyz"),
            serialNumber="pipette-id",
            data=PipetteData(
                channels=96,
                min_volume=1,
                max_volume=1000,
            ),
        )
    ]
