from typing_extensions import Literal
from typing import List, Dict, Tuple, cast, Optional
from pydantic import BaseModel, Field, validator
from enum import Enum
from dataclasses import dataclass

from . import types as pip_types

PLUNGER_CURRENT_MINIMUM = 0.1
PLUNGER_CURRENT_MAXIMUM = 1.5


PipetteModelMajorVersion = [1, 2, 3]
PipetteModelMinorVersion = [0, 1, 2, 3, 4, 5]

# TODO Literals are only good for writing down
# exact values. Is there a better typing mechanism
# so we don't need to keep track of versions in two
# different places?
PipetteModelMajorVersionType = Literal[1, 2, 3]
PipetteModelMinorVersionType = Literal[0, 1, 2, 3, 4, 5]


class PipetteTipType(Enum):
    t10 = 10
    t20 = 20
    t50 = 50
    t200 = 200
    t300 = 300
    t1000 = 1000


class PipetteChannelType(Enum):
    SINGLE_CHANNEL = 1
    EIGHT_CHANNEL = 8
    NINETY_SIX_CHANNEL = 96

    @property
    def as_int(self) -> int:
        return self.value

    def __str__(self) -> str:
        if self.value == 96:
            return "96"
        elif self.value == 8:
            return "multi"
        else:
            return "single"


class PipetteModelType(Enum):
    p10 = "p10"
    p20 = "p20"
    p50 = "p50"
    p300 = "p300"
    p1000 = "p1000"


class PipetteGenerationType(Enum):
    GEN1 = "GEN1"
    GEN2 = "GEN2"
    FLEX = "FLEX"


PIPETTE_AVAILABLE_TYPES = [m.name for m in PipetteModelType]
PIPETTE_CHANNELS_INTS = [c.as_int for c in PipetteChannelType]
PIPETTE_GENERATIONS = [g.name.lower() for g in PipetteGenerationType]


@dataclass(frozen=True)
class PipetteVersionType:
    major: PipetteModelMajorVersionType
    minor: PipetteModelMinorVersionType

    @classmethod
    def convert_from_float(cls, version: float) -> "PipetteVersionType":
        major = cast(PipetteModelMajorVersionType, int(version // 1))
        minor = cast(PipetteModelMinorVersionType, int(round((version % 1), 2) * 10))
        return cls(major=major, minor=minor)

    def __str__(self) -> str:
        return f"{self.major}.{self.minor}"

    @property
    def as_tuple(
        self,
    ) -> Tuple[PipetteModelMajorVersionType, PipetteModelMinorVersionType]:
        return (self.major, self.minor)


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
    default_tip_length: float = Field(
        ...,
        description="The default tip length associated with this tip type.",
        alias="defaultTipLength",
    )
    default_tip_overlap: float = Field(
        ...,
        description="The default tip overlap associated with this tip type.",
        alias="defaultTipOverlap",
    )
    default_return_tip_height: Optional[float] = Field(
        ...,
        description="The height to return a tip to its tiprack.",
        alias="defaultReturnTipHeight",
    )
    aspirate: Dict[str, List[Tuple[float, float, float]]] = Field(
        ..., description="The default pipetting functions list for aspirate."
    )
    dispense: Dict[str, List[Tuple[float, float, float]]] = Field(
        ..., description="The default pipetting functions list for dispensing."
    )
    tip_overlap_dictionary: Dict[str, float] = Field(
        default={},
        description="The default tip overlap associated with this tip type.",
        alias="defaultTipOverlapDictionary",
    )
    default_blowout_volume: Optional[float] = Field(
        ...,
        description="The default volume for a blowout command with this tip type.",
        alias="defaultBlowoutVolume",
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
    blow_out: float = Field(
        ...,
        description="The plunger position past 0 volume to blow out liquid.",
        alias="blowout",
    )
    drop_tip: float = Field(
        ..., description="The plunger position used to drop tips.", alias="drop"
    )


class TipHandlingConfigurations(BaseModel):
    current: float = Field(
        ...,
        description="Either the z motor current needed for picking up tip or the plunger motor current for dropping tip off the nozzle.",
    )
    speed: float = Field(
        ...,
        description="The speed to move the z or plunger axis for tip pickup or drop off.",
    )
    presses: int = Field(
        default=0.0, description="The number of tries required to force pick up a tip."
    )
    increment: float = Field(
        default=0.0,
        description="The increment to move the pipette down for force tip pickup retries.",
    )
    distance: float = Field(
        default=0.0, description="The distance to begin a pick up tip from."
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
    pipette_backcompat_names: List[str] = Field(
        ...,
        description="A list of pipette names that are compatible with this pipette.",
        alias="backCompatNames",
    )
    pipette_type: PipetteModelType = Field(
        ...,
        description="The pipette model type (related to number of channels).",
        alias="model",
    )
    display_category: PipetteGenerationType = Field(
        ..., description="The product model of the pipette.", alias="displayCategory"
    )
    pick_up_tip_configurations: TipHandlingConfigurations = Field(
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
    shaft_diameter: float = Field(
        ..., description="The diameter of the pipette shaft.", alias="shaftDiameter"
    )
    shaft_ul_per_mm: float = Field(
        ...,
        description="The conversion rate between uL dispensed and mm of motor movement.",
        alias="shaftULperMM",
    )
    backlash_distance: float = Field(
        ...,
        description="The distance of backlash on the plunger motor.",
        alias="backlashDistance",
    )
    quirks: List[pip_types.Quirks] = Field(
        ..., description="The list of quirks available for the loaded configuration"
    )

    @validator("pipette_type", pre=True)
    def convert_pipette_model_string(cls, v: str) -> PipetteModelType:
        return PipetteModelType(v)

    @validator("channels", pre=True)
    def convert_channels(cls, v: int) -> PipetteChannelType:
        return PipetteChannelType(v)

    @validator("display_category", pre=True)
    def convert_display_category(cls, v: str) -> PipetteGenerationType:
        if not v:
            return PipetteGenerationType.GEN1
        return PipetteGenerationType(v)

    @validator("quirks", pre=True)
    def convert_quirks(cls, v: str) -> List[pip_types.Quirks]:
        if not v:
            return []
        return [pip_types.Quirks(q) for q in v]

    class Config:
        json_encoders = {
            PipetteChannelType: lambda v: v.value,
            PipetteModelType: lambda v: v.value,
            PipetteGenerationType: lambda v: v.value,
        }


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
    max_volume: int = Field(
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

    version: PipetteVersionType = Field(
        ..., description="The version of the configuration loaded."
    )
    mount_configurations: pip_types.RobotMountConfigs = Field(
        ...,
    )
