"""Instruments routes."""
from typing import Optional, TypeVar, Union, Generic, List

from fastapi import APIRouter, status, Depends
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control.instruments.ot3.instrument_calibration import \
    GripperCalibrationOffset
from opentrons.types import Mount
from robot_server.hardware import get_hardware
from robot_server.service.json_api import (
    SimpleMultiBody, PydanticResponse, MultiBodyMeta,
)
from robot_server.versioning import get_requested_version

from opentrons.protocol_engine.types import Vec3f
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import GripperJawState

from opentrons_shared_data.pipette.dev_types import (
    PipetteName,
    PipetteModel, ChannelCount,
)
from opentrons_shared_data.gripper.dev_types import (
    GripperName,
    GripperModel,
)

instruments_router = APIRouter()

InstrumentT = TypeVar("InstrumentT", bound=Union[GripperName, PipetteName])
InstrumentModelT = TypeVar("InstrumentModelT", bound=Union[GripperModel, PipetteModel])
InstrumentDataT = TypeVar("InstrumentDataT", bound=BaseModel)


class GenericInstrument(
    GenericModel, Generic[InstrumentT, InstrumentModelT, InstrumentDataT]):
    """Base instrument response."""
    instrumentName: Union[PipetteName, GripperName] = Field(..., description="Name of the instrument.")
    instrumentModel: Union[PipetteModel, GripperModel] = Field(..., description="Instrument model.")
    instrumentId: str = Field(..., description="Instrument hardware ID.")
    data: InstrumentDataT


class GripperData(BaseModel):
    """Data from attached gripper"""
    # TODO: maybe add gripper config data if useful
    jawState: GripperJawState = Field(
        ...,
        description="Gripper Jaw state."
    )
    calibratedOffset: Optional[GripperCalibrationOffset] = Field(
        None,
        description="Calibrated gripper offset."
    )


class PipetteData(BaseModel):
    """Data from attached pipette"""
    channels: ChannelCount = Field(..., description="Number of pipette channels.")
    min_volume: float = Field(..., description="Minimum pipette volume.")
    max_volume: float = Field(..., description="Maximum pipette volume.")
    # TODO (spp, 2022-12-20: add more)


class Pipette(
    GenericInstrument[PipetteName, PipetteModel, PipetteData]
):
    """Attached gripper info & configuration."""
    instrumentName: PipetteName
    instrumentModel: PipetteModel
    instrumentId: str
    data: PipetteData


class Gripper(
    GenericInstrument[GripperName, GripperModel, GripperData]
):
    """Attached gripper info & configuration."""
    instrumentName: GripperName
    instrumentModel: GripperModel
    instrumentId: str
    data: GripperData


# TODO: add pipettes to this
class AttachedInstrument(BaseModel):
    leftMount: Union[Pipette, None] = Field(..., description="Left pipette information.")
    rightMount: Union[Pipette, None] = Field(..., description="Right pipette information.")
    gripperMount: Union[Gripper, None] = Field(..., description="Gripper information.")


def _pipette_dict_to_pipette(pipette_dict: PipetteDict) -> Pipette:
    """Convert pipettedict to local Pipette class."""
    return Pipette(
        instrumentName=pipette_dict['name'],
        instrumentModel=pipette_dict['model'],
        instrumentId=pipette_dict['pipette_id'],
        data=PipetteData(
            channels=pipette_dict['channels'],
            min_volume=pipette_dict['min_volume'],
            max_volume=pipette_dict['max_volume'],
        )
    )


@instruments_router.get(
    path="/instruments",
    summary="Get attached instruments.",
    description="Get a list of all instruments (pipettes & gripper) currently attached"
                " to the robot.",
    responses={
        status.HTTP_200_OK: {"model": SimpleMultiBody[AttachedInstrument]}
    }
)
async def get_attached_instruments(
    requested_version: int = Depends(get_requested_version),
    hardware: HardwareControlAPI = Depends(get_hardware),
) -> PydanticResponse[SimpleMultiBody[AttachedInstrument]]:
    """Get a list of all attached instruments."""
    if requested_version <= 2:
        raise Exception("This endpoint is only available on versions > 2")

    response_data = AttachedInstrument(leftMount=None, rightMount=None, gripperMount=None)
    ot3_hardware = ensure_ot3_hardware(hardware_api=hardware)
    await ot3_hardware.cache_instruments()
    gripper = ot3_hardware.attached_gripper
    pipettes = ot3_hardware.attached_pipettes
    left_pip = pipettes.get(Mount.LEFT)
    right_pip = pipettes.get(Mount.RIGHT)

    response_data.gripperMount = Gripper(
            instrumentName=gripper['name'],
            instrumentModel=gripper['model'],
            instrumentId=gripper['gripper_id'],
            data=GripperData(
                jawState=gripper['state'],
                calibratedOffset=gripper['calibration_offset'],
            )
        ) if gripper else None

    response_data.leftMount = _pipette_dict_to_pipette(left_pip) if left_pip else None
    response_data.rightMount = _pipette_dict_to_pipette(right_pip) if right_pip else None

    return await PydanticResponse.create(
        content=SimpleMultiBody.construct(
            data=response_data,
            meta=MultiBodyMeta(cursor=0, totalLength=1)
        ),
        status_code=status.HTTP_200_OK,
    )
