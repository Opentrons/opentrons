"""Pipetting command models."""

from pydantic import BaseModel, Field
from .command import BaseCommand


class BasePipettingRequest(BaseModel):
    pipetteId: str = Field(
        ...,
        description="Identifier of pipette to use for liquid handling."
    )
    labwareId: str = Field(..., description="Identifier of labware to use.")
    wellId: str = Field(..., description="Identifier of well to use.")


class BaseLiquidHandlingRequest(BasePipettingRequest):
    volume: float = Field(
        ...,
        description="Amount of liquid in uL. Must be greater than 0 and less "
                    "than a pipette-specific maximum volume.",
        gt=0,
    )
    flowRate: float = Field(
        ...,
        description="The absolute flow rate in uL/second. Must be greater "
                    "than 0 and less than a pipette-specific maximum flow "
                    "rate.",
        gt=0
    )


class MoveToWellRequest(BasePipettingRequest):
    pass


class MoveToWellResponse(BaseModel):
    pass


class PickUpTipRequest(BasePipettingRequest):
    pass


class PickUpTipResponse(BaseModel):
    pass


class DropTipRequest(BasePipettingRequest):
    pass


class DropTipResponse(BaseModel):
    pass


class AspirateRequest(BaseLiquidHandlingRequest):
    pass


class AspirateResponse(BaseModel):
    pass


class DispenseRequest(BaseLiquidHandlingRequest):
    pass


class DispenseResponse(BaseModel):
    pass


MoveToWellCommand = BaseCommand[MoveToWellRequest, MoveToWellResponse]
PickUpTipCommand = BaseCommand[PickUpTipRequest, PickUpTipResponse]
DropTipCommand = BaseCommand[DropTipRequest, DropTipResponse]
AspirateCommand = BaseCommand[AspirateRequest, AspirateResponse]
DispenseCommand = BaseCommand[DispenseRequest, DispenseResponse]
