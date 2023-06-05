"""Instruments routes."""
from typing import Optional, List, Dict

from fastapi import APIRouter, status, Depends

from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    PipetteOffsetByPipetteMount,
)
from opentrons.hardware_control.types import OT3Mount
from opentrons.protocol_engine.errors import HardwareNotSupportedError

from robot_server.hardware import get_hardware
from robot_server.service.json_api import (
    SimpleMultiBody,
    PydanticResponse,
    MultiBodyMeta,
)

from opentrons.types import Mount, MountType
from opentrons.protocol_engine.types import Vec3f
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.dev_types import PipetteDict, GripperDict
from opentrons_shared_data.gripper.gripper_definition import GripperModelStr

from .instrument_models import (
    PipetteData,
    Pipette,
    InstrumentCalibrationData,
    GripperData,
    Gripper,
    AttachedInstrument,
)

instruments_router = APIRouter()


def _pipette_dict_to_pipette_res(
    pipette_dict: PipetteDict,
    pipette_offset: Optional[PipetteOffsetByPipetteMount],
    mount: Mount,
) -> Pipette:
    """Convert PipetteDict to Pipette response model."""
    if pipette_dict:
        calibration_data = pipette_offset
        return Pipette.construct(
            mount=MountType.from_hw_mount(mount).value,
            instrumentName=pipette_dict["name"],
            instrumentModel=pipette_dict["model"],
            serialNumber=pipette_dict["pipette_id"],
            data=PipetteData(
                channels=pipette_dict["channels"],
                min_volume=pipette_dict["min_volume"],
                max_volume=pipette_dict["max_volume"],
                calibratedOffset=InstrumentCalibrationData.construct(
                    offset=Vec3f(
                        x=calibration_data.offset.x,
                        y=calibration_data.offset.y,
                        z=calibration_data.offset.z,
                    ),
                    source=calibration_data.source,
                    last_modified=calibration_data.last_modified,
                )
                if calibration_data
                else None,
            ),
        )


def _gripper_dict_to_gripper_res(gripper_dict: GripperDict) -> Gripper:
    """Convert GripperDict to Gripper response model."""
    calibration_data = gripper_dict["calibration_offset"]
    return Gripper.construct(
        mount=MountType.EXTENSION.value,
        instrumentModel=GripperModelStr(str(gripper_dict["model"])),
        serialNumber=gripper_dict["gripper_id"],
        data=GripperData(
            jawState=gripper_dict["state"].name.lower(),
            calibratedOffset=InstrumentCalibrationData.construct(
                offset=Vec3f(
                    x=calibration_data.offset.x,
                    y=calibration_data.offset.y,
                    z=calibration_data.offset.z,
                ),
                source=calibration_data.source,
                last_modified=calibration_data.last_modified,
            ),
        ),
    )


@instruments_router.get(
    path="/instruments",
    summary="Get attached instruments.",
    description="Get a list of all instruments (pipettes & gripper) currently attached"
    " to the robot.",
    responses={status.HTTP_200_OK: {"model": SimpleMultiBody[AttachedInstrument]}},
)
async def get_attached_instruments(
    hardware: HardwareControlAPI = Depends(get_hardware),
) -> PydanticResponse[SimpleMultiBody[AttachedInstrument]]:
    """Get a list of all attached instruments."""
    pipettes: Dict[Mount, PipetteDict]
    gripper: Optional[GripperDict] = None
    pipette_offsets: Optional[Dict[Mount, PipetteOffsetByPipetteMount]] = None

    try:
        # TODO (spp, 2023-01-06): revise according to
        #  https://opentrons.atlassian.net/browse/RET-1295
        ot3_hardware = ensure_ot3_hardware(hardware_api=hardware)
        # OT3
        await hardware.cache_instruments()
        gripper = ot3_hardware.attached_gripper
        pipettes = ot3_hardware.attached_pipettes
        pipette_offsets = {
            mount: ot3_hardware.get_instrument_offset(OT3Mount.from_mount(mount))  # type: ignore[misc]
            for mount in pipettes.keys()
        }

    except HardwareNotSupportedError:
        # OT2
        pipettes = hardware.attached_instruments

    response_data: List[AttachedInstrument] = [
        _pipette_dict_to_pipette_res(
            pipette_dict=pipette_dict,
            mount=mount,
            pipette_offset=pipette_offsets[mount] if pipette_offsets else None,
        )
        for mount, pipette_dict in pipettes.items()
        if pipette_dict
    ]

    if gripper:
        response_data.append(_gripper_dict_to_gripper_res(gripper_dict=gripper))

    return await PydanticResponse.create(
        content=SimpleMultiBody.construct(
            data=response_data,
            meta=MultiBodyMeta(cursor=0, totalLength=len(response_data)),
        ),
        status_code=status.HTTP_200_OK,
    )
