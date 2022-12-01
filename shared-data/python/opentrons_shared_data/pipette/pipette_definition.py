from typing_extensions import Literal
from typing import List, Dict, Tuple, cast
from pydantic import BaseModel, Field, validator
from enum import Enum
from dataclasses import dataclass

PLUNGER_CURRENT_MINIMUM = 0.1
PLUNGER_CURRENT_MAXIMUM = 1.5


PipetteModelMajorVersion = Literal[1]
PipetteModelMinorVersion = Literal[0, 1, 2, 3]


class PipetteTipType(Enum):
    t50 = "t50"
    t200 = "t200"
    t1000 = "t1000"


class PipetteChannelType(Enum):
    SINGLE_CHANNEL = 1
    EIGHT_CHANNEL = 8
    NINETY_SIX_CHANNEL = 96

    @property
    def as_int(self) -> int:
        return self.value


class PipetteModelType(Enum):
    p50 = "p50"
    p1000 = "p1000"


@dataclass(frozen=True)
class PipetteVersionType:
    major: PipetteModelMajorVersion
    minor: PipetteModelMinorVersion

    @classmethod
    def convert_from_float(cls, version: float) -> "PipetteVersionType":
        major = cast(PipetteModelMajorVersion, int(version // 1))
        minor = cast(PipetteModelMinorVersion, int(round((version % 1), 2) * 10))
        return cls(major=major, minor=minor)


class SupportedTipsDefinition(BaseModel):
    """Tip parameters available for every tip size."""

    default_aspirate_flowrate: float = Field(
        ...,
        description="The flowrate used in aspirations by default.",
        alias="defaultAspirateFlowRate",
    )
    default_dispense_flowrate: float = Field(
        ...,
        description="The flowrate used in dispenses by default.",
        alias="defaultDispenseFlowRate",
    )
    default_blowout_flowrate: float = Field(
        ...,
        description="The flowrate used in blowouts by default.",
        alias="defaultBlowOutFlowRate",
    )
    aspirate: Dict[str, List[Tuple[float, float, float]]] = Field(
        ..., description="The default pipetting functions list for aspirate."
    )
    dispense: Dict[str, List[Tuple[float, float, float]]] = Field(
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
    partial_tip_supported: bool = Field(
        ...,
        description="Whether partial tip pick up is supported.",
        alias="partialTipSupported",
    )
    available_configurations: List[int] = Field(
        default=None,
        description="A list of the types of partial tip configurations supported, listed by channel ints",
        alias="availableConfigurations",
    )


class PipettePhysicalPropertiesDefinition(BaseModel):
    """The physical properties definition of a pipette."""

    display_name: str = Field(
        ...,
        description="The display or full product name of the pipette.",
        alias="displayName",
    )
    pipette_type: PipetteModelType = Field(
        ...,
        description="The pipette model type (related to number of channels).",
        alias="model",
    )
    display_category: str = Field(
        ..., description="The product model of the pipette.", alias="displayCategory"
    )
    pick_up_tip_configurations: PickUpTipConfigurations = Field(
        ..., alias="pickUpTipConfigurations"
    )
    drop_tip_configurations: TipHandlingConfigurations = Field(
        ..., alias="dropTipConfigurations"
    )
    plunger_motor_configurations: MotorConfigurations = Field(
        ..., alias="plungerMotorConfigurations"
    )
    plunger_positions_configurations: PlungerPositions = Field(
        ..., alias="plungerPositionsConfigurations"
    )
    available_sensors: AvailableSensorDefinition = Field(..., alias="availableSensors")
    partial_tip_configurations: PartialTipDefinition = Field(
        ..., alias="partialTipConfigurations"
    )
    channels: PipetteChannelType = Field(
        ..., description="The maximum number of channels on the pipette."
    )

    @validator("pipette_type", pre=True)
    def convert_pipette_model_string(cls, v: str) -> PipetteModelType:
        return PipetteModelType(v)

    @validator("channels", pre=True)
    def convert_channels(cls, v: int) -> PipetteChannelType:
        return PipetteChannelType(v)


class PipetteGeometryDefinition(BaseModel):
    """The geometry properties definition of a pipette."""

    nozzle_offset: List[float] = Field(..., alias="nozzleOffset")
    path_to_3D: str = Field(
        ...,
        description="The shared data relative path to the 3D representation of the pipette model.",
        alias="pathTo3D",
    )


class PipetteLiquidPropertiesDefinition(BaseModel):
    """The liquid properties definition of a pipette."""

    supported_tips: Dict[PipetteTipType, SupportedTipsDefinition] = Field(
        ..., alias="supportedTips"
    )
    max_volume: float = Field(
        ...,
        description="The maximum supported volume of the pipette.",
        alias="maxVolume",
    )
    min_volume: float = Field(
        ...,
        description="The minimum supported volume of the pipette.",
        alias="minVolume",
    )
    default_tipracks: List[str] = Field(
        ...,
        description="A list of default tiprack paths.",
        regex="opentrons/[a-z0-9._]+/[0-9]",
        alias="defaultTipracks",
    )

    @validator("supported_tips", pre=True)
    def convert_aspirate_key_to_channel_type(
        cls, v: Dict[str, SupportedTipsDefinition]
    ) -> Dict[PipetteTipType, SupportedTipsDefinition]:
        return {PipetteTipType[key]: value for key, value in v.items()}


class PipetteConfigurations(
    PipetteGeometryDefinition,
    PipettePhysicalPropertiesDefinition,
    PipetteLiquidPropertiesDefinition,
):
    """The full pipette configurations of a given model and version."""

    pass
