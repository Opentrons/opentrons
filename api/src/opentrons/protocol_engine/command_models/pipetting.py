"""
Pipetting command request and result models.

These models are defined using Pydantic because they are part of the public
input / output of the engine, and need validation and/or scheme generation.
"""

from pydantic import BaseModel, Field


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


class MoveToWellResult(BaseModel):
    pass


class PickUpTipRequest(BasePipettingRequest):
    pass


class PickUpTipResult(BaseModel):
    pass


class DropTipRequest(BasePipettingRequest):
    pass


class DropTipResult(BaseModel):
    pass


class AspirateRequest(BaseLiquidHandlingRequest):
    pass


class AspirateResult(BaseModel):
    pass


class DispenseRequest(BaseLiquidHandlingRequest):
    pass


class DispenseResult(BaseModel):
    pass
