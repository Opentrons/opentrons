import re
from typing import List, Dict, Tuple, Optional
from pydantic import BaseModel, Field, validator
from typing_extensions import Literal
from dataclasses import dataclass

from . import types as pip_types, dev_types

PLUNGER_CURRENT_MINIMUM = 0.1
PLUNGER_CURRENT_MAXIMUM = 1.5

NOZZLE_MAP_NAMES = re.compile(r"[A-Z]{1}[0-9]{1,2}")


# TODO (lc 12-5-2022) Ideally we can deprecate this
# at somepoint once we load pipettes by channels and type
@dataclass
class PipetteNameType:
    pipette_type: pip_types.PipetteModelType
    pipette_channels: pip_types.PipetteChannelType
    pipette_generation: pip_types.PipetteGenerationType

    def __repr__(self) -> str:
        base_name = f"{self.pipette_type.name}_{str(self.pipette_channels)}"
        if self.pipette_generation == pip_types.PipetteGenerationType.GEN1:
            return base_name
        elif self.pipette_channels == pip_types.PipetteChannelType.NINETY_SIX_CHANNEL:
            return base_name
        else:
            return f"{base_name}_{self.pipette_generation.name.lower()}"

    def get_version(self) -> pip_types.PipetteVersionType:
        if self.pipette_generation == pip_types.PipetteGenerationType.FLEX:
            return pip_types.PipetteVersionType(3, 0)
        elif self.pipette_generation == pip_types.PipetteGenerationType.GEN2:
            return pip_types.PipetteVersionType(2, 0)
        else:
            return pip_types.PipetteVersionType(1, 0)


@dataclass
class PipetteModelVersionType:
    pipette_type: pip_types.PipetteModelType
    pipette_channels: pip_types.PipetteChannelType
    pipette_version: pip_types.PipetteVersionType

    def __repr__(self) -> str:
        base_name = f"{self.pipette_type.name}_{str(self.pipette_channels)}"

        return f"{base_name}_v{self.pipette_version}"


class FlowRateDefinition(BaseModel):
    default: float = Field(..., description="Highest API level default fallback.")
    values_by_api_level: Dict[str, float] = Field(
        ..., description="flow rates keyed by API level.", alias="valuesByApiLevel"
    )


PipetteFunctionKeyType = Literal["1", "2", "3"]
ulPerMMType = Dict[PipetteFunctionKeyType, List[Tuple[float, float, float]]]


class ulPerMMDefinition(BaseModel):
    default: ulPerMMType


class SupportedTipsDefinition(BaseModel):
    """Tip parameters available for every tip size."""

    default_aspirate_flowrate: FlowRateDefinition = Field(
        ...,
        description="The flowrate used in aspirations by default.",
        alias="defaultAspirateFlowRate",
    )
    default_dispense_flowrate: FlowRateDefinition = Field(
        ...,
        description="The flowrate used in dispenses by default.",
        alias="defaultDispenseFlowRate",
    )
    default_blowout_flowrate: FlowRateDefinition = Field(
        ...,
        description="The flowrate used in blowouts by default.",
        alias="defaultBlowOutFlowRate",
    )
    default_flow_acceleration: float = Field(
        float("inf"),  # no default works for all pipettes
        description="The acceleration used during aspirate/dispense/blowout in ul/s^2.",
        alias="defaultFlowAcceleration",
    )
    default_tip_length: float = Field(
        ...,
        description="The default tip length associated with this tip type.",
        alias="defaultTipLength",
    )
    default_return_tip_height: float = Field(
        default=0.5,
        description="The height to return a tip to its tiprack.",
        alias="defaultReturnTipHeight",
    )
    aspirate: ulPerMMDefinition = Field(
        ..., description="The default pipetting functions list for aspirate."
    )
    dispense: ulPerMMDefinition = Field(
        ..., description="The default pipetting functions list for dispensing."
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
    pipette_backcompat_names: List[dev_types.PipetteName] = Field(
        ...,
        description="A list of pipette names that are compatible with this pipette.",
        alias="backCompatNames",
    )
    pipette_type: pip_types.PipetteModelType = Field(
        ...,
        description="The pipette model type (related to number of channels).",
        alias="model",
    )
    display_category: pip_types.PipetteGenerationType = Field(
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
    channels: pip_types.PipetteChannelType = Field(
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
    def convert_pipette_model_string(cls, v: str) -> pip_types.PipetteModelType:
        return pip_types.PipetteModelType(v)

    @validator("channels", pre=True)
    def convert_channels(cls, v: int) -> pip_types.PipetteChannelType:
        return pip_types.PipetteChannelType(v)

    @validator("display_category", pre=True)
    def convert_display_category(cls, v: str) -> pip_types.PipetteGenerationType:
        if not v:
            return pip_types.PipetteGenerationType.GEN1
        return pip_types.PipetteGenerationType(v)

    @validator("quirks", pre=True)
    def convert_quirks(cls, v: List[str]) -> List[pip_types.Quirks]:
        return [pip_types.Quirks(q) for q in v]

    class Config:
        json_encoders = {
            pip_types.PipetteChannelType: lambda v: v.value,
            pip_types.PipetteModelType: lambda v: v.value,
            pip_types.PipetteGenerationType: lambda v: v.value,
            pip_types.Quirks: lambda v: v.value,
        }


class PipetteGeometryDefinition(BaseModel):
    """The geometry properties definition of a pipette."""

    nozzle_offset: List[float] = Field(..., alias="nozzleOffset")
    path_to_3D: str = Field(
        ...,
        description="The shared data relative path to the 3D representation of the pipette model.",
        alias="pathTo3D",
    )
    nozzle_map: Dict[str, List[float]] = Field(..., alias="nozzleMap")

    @validator("nozzle_map", pre=True)
    def check_nonempty_strings(
        cls, v: Dict[str, List[float]]
    ) -> Dict[str, List[float]]:
        # Note, the key should be able to be a regex but I think
        # we're not on a pydantic version that supports that.
        for k in v.keys():
            if not NOZZLE_MAP_NAMES.match(k):
                raise ValueError("{k} is not a valid key entry for nozzle map.")
        return v


class PipetteLiquidPropertiesDefinition(BaseModel):
    """The liquid properties definition of a pipette."""

    supported_tips: Dict[pip_types.PipetteTipType, SupportedTipsDefinition] = Field(
        ..., alias="supportedTips"
    )
    tip_overlap_dictionary: Dict[str, float] = Field(
        ...,
        description="The default tip overlap associated with this tip type.",
        alias="defaultTipOverlapDictionary",
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
    ) -> Dict[pip_types.PipetteTipType, SupportedTipsDefinition]:
        return {pip_types.PipetteTipType[key]: value for key, value in v.items()}


class PipetteConfigurations(
    PipetteGeometryDefinition,
    PipettePhysicalPropertiesDefinition,
    PipetteLiquidPropertiesDefinition,
):
    """The full pipette configurations of a given model and version."""

    version: pip_types.PipetteVersionType = Field(
        ..., description="The version of the configuration loaded."
    )
    mount_configurations: pip_types.RobotMountConfigs = Field(
        ...,
    )
