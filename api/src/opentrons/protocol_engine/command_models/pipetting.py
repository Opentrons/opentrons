"""
Pipetting command request and result models.

These models are defined using Pydantic because they are part of the public
input / output of the engine, and need validation and/or scheme generation.
"""

from pydantic import BaseModel, Field


class BasePipettingRequest(BaseModel):
    """Base class for pipetting requests that interact with wells."""

    pipetteId: str = Field(
        ...,
        description="Identifier of pipette to use for liquid handling."
    )
    labwareId: str = Field(..., description="Identifier of labware to use.")
    wellName: str = Field(..., description="Identifier of well to use.")


class BaseLiquidHandlingRequest(BasePipettingRequest):
    """Base class for liquid handling requests."""

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
    """A request to move a pipette to a specific well."""

    pass


class MoveToWellResult(BaseModel):
    """The result of a MoveToWellRequest."""

    pass


class PickUpTipRequest(BasePipettingRequest):
    """A request to pick up a tip."""

    pass


class PickUpTipResult(BaseModel):
    """The result of a PickUpTipRequest."""

    pass


class DropTipRequest(BasePipettingRequest):
    """A request to drop a tip."""

    pass


class DropTipResult(BaseModel):
    """The result of a DropTipRequest."""

    pass


class AspirateRequest(BaseLiquidHandlingRequest):
    """A request to aspirate liquid from a well."""

    pass


class AspirateResult(BaseModel):
    """The result of a AspirateRequest."""

    pass


class DispenseRequest(BaseLiquidHandlingRequest):
    """A request to dispense liquid into a well."""

    pass


class DispenseResult(BaseModel):
    """The result of a DispenseRequest."""

    pass
