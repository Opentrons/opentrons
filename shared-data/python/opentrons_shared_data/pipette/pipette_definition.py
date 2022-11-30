from typing import List, Dict
from pydantic import BaseModel, Field


class SupportedTipsDefinition(BaseModel):
    """Tip parameters available for every tip size."""

    defaultAspirateFlowRate: float = Field(
        ..., description="The flowrate used in aspirations by default."
    )
    defaultDispenseFlowRate: float = Field(
        ..., description="The flowrate used in dispenses by default."
    )
    defaultBlowOutFlowRate: float = Field(
        ..., description="The flowrate used in blowouts by default."
    )
    aspirate: Dict[str, List[float]] = Field(
        ..., description="The default pipetting functions list for aspirate."
    )
    dispense: Dict[str, List[float]] = Field(
        ..., description="The default pipetting functions list for dispensing."
    )


class MotorConfigurations(BaseModel):
    idle: float = Field(
        ..., description="The plunger motor current to use during idle states."
    )
    run: float = Field(
        ..., description="The plunger motor current to use during active states."
    )


class PlungerPositions(BaseModel):
    top: float = Field(
        ...,
        description="The plunger position that describes max available volume of a pipette in mm.",
    )
    bottom: float = Field(
        ...,
        description="The plunger position that describes min available volume of a pipette in mm.",
    )
    blowout: float = Field(
        ..., description="The plunger position past 0 volume to blow out liquid."
    )
    drop: float = Field(..., description="The plunger position used to drop tips.")


class TipHandlingConfigurations(BaseModel):
    current: float = Field(
        ...,
        description="Either the z motor current needed for picking up tip or the plunger motor current for dropping tip off the nozzle.",
    )
    speed: float = Field(
        ...,
        description="The speed to move the z or plunger axis for tip pickup or drop off.",
    )


class PickUpTipConfigurations(TipHandlingConfigurations):
    presses: int = Field(
        ..., description="The number of tries required to force pick up a tip."
    )
    increment: float = Field(
        ...,
        description="The increment to move the pipette down for force tip pickup retries.",
    )
    distance: float = Field(
        ..., description="The distance to begin a pick up tip from."
    )


class AvailableSensorDefinition(BaseModel):
    """The number and type of sensors available in the pipette."""

    sensors: List[str] = Field(..., description="")


class PartialTipDefinition(BaseModel):
    partialTipSupported: bool = Field(
        ..., description="Whether partial tip pick up is supported."
    )
    availableConfigurations: List[int] = Field(
        default=None,
        description="A list of the types of partial tip configurations supported, listed by channel ints",
    )


class PipettePhysicalPropertiesDefinition(BaseModel):
    """The physical properties definition of a pipette."""

    displayName: str = Field(
        ..., description="The display or full product name of the pipette."
    )
    model: str = Field(
        ..., description="The pipette model type (related to number of channels)"
    )
    displayCategory: str = Field(..., description="The product model of the pipette.")
    pickUpTipConfigurations: PickUpTipConfigurations
    dropTipConfigurations: TipHandlingConfigurations
    plungerMotorConfigurations: MotorConfigurations
    plungerPositionsConfigurations: PlungerPositions
    availableSensors: AvailableSensorDefinition
    partialTipConfigurations: PartialTipDefinition
    channels: int = Field(
        ..., description="The maximum number of channels on the pipette."
    )


class PipetteGeometryDefinition(BaseModel):
    """The geometry properties definition of a pipette."""

    nozzleOffset: List[float]
    pathTo3D: str = Field(
        ...,
        description="The shared data relative path to the 3D representation of the pipette model.",
    )


class PipetteLiquidPropertiesDefinition(BaseModel):
    """The liquid properties definition of a pipette."""

    supportedTips: Dict[str, SupportedTipsDefinition]
    maxVolume: float = Field(
        ..., description="The maximum supported volume of the pipette."
    )
    minVolume: float = Field(
        ..., description="The minimum supported volume of the pipette."
    )
    defaultTipracks: List[str] = Field(
        ...,
        description="A list of default tiprack paths.",
        regex="opentrons/[a-z0-9._]+/[0-9]",
    )


class PipetteConfigurations(BaseModel):
    """The full pipette configurations of a given model and version."""

    geometry: PipetteGeometryDefinition
    physical: PipettePhysicalPropertiesDefinition
    liquid: PipetteLiquidPropertiesDefinition
