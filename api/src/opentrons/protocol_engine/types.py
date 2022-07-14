"""Public protocol engine value types and models."""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from dataclasses import dataclass
from pydantic import BaseModel, Field
from typing import Optional, Union, List, Dict, Any, NamedTuple
from typing_extensions import Literal, TypeGuard

from opentrons.types import MountType, DeckSlotName
from opentrons.hardware_control.modules import ModuleType as ModuleType

# convenience re-export of LabwareUri type
from opentrons_shared_data.pipette.dev_types import (  # noqa: F401
    LabwareUri as LabwareUri,
)


class EngineStatus(str, Enum):
    """Current execution status of a ProtocolEngine."""

    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    BLOCKED_BY_OPEN_DOOR = "blocked-by-open-door"
    STOP_REQUESTED = "stop-requested"
    STOPPED = "stopped"
    FINISHING = "finishing"
    FAILED = "failed"
    SUCCEEDED = "succeeded"


class DeckSlotLocation(BaseModel):
    """The location of something placed in a single deck slot."""

    slotName: DeckSlotName


class ModuleLocation(BaseModel):
    """The location of something placed atop a hardware module."""

    moduleId: str = Field(
        ...,
        description="The ID of a loaded module from a prior `loadModule` command.",
    )


LabwareLocation = Union[DeckSlotLocation, ModuleLocation]
"""Union of all locations where it's legal to load a labware."""


class WellOrigin(str, Enum):
    """Origin of WellLocation offset."""

    TOP = "top"
    BOTTOM = "bottom"


class WellOffset(BaseModel):
    """An offset vector in (x, y, z)."""

    x: float = 0
    y: float = 0
    z: float = 0


class WellLocation(BaseModel):
    """A relative location in reference to a well's location."""

    origin: WellOrigin = WellOrigin.TOP
    offset: WellOffset = Field(default_factory=WellOffset)


@dataclass(frozen=True)
class Dimensions:
    """Dimensions of an object in deck-space."""

    x: float
    y: float
    z: float


class DeckPoint(BaseModel):
    """Coordinates of a point in deck space."""

    x: float
    y: float
    z: float


# TODO(mc, 2021-04-16): reconcile with opentrons_shared_data
# shared-data/python/opentrons_shared_data/pipette/dev_types.py
class PipetteName(str, Enum):
    """Pipette load name values."""

    P10_SINGLE = "p10_single"
    P10_MULTI = "p10_multi"
    P20_SINGLE_GEN2 = "p20_single_gen2"
    P20_MULTI_GEN2 = "p20_multi_gen2"
    P50_SINGLE = "p50_single"
    P50_MULTI = "p50_multi"
    P300_SINGLE = "p300_single"
    P300_MULTI = "p300_multi"
    P300_SINGLE_GEN2 = "p300_single_gen2"
    P300_MULTI_GEN2 = "p300_multi_gen2"
    P1000_SINGLE = "p1000_single"
    P1000_SINGLE_GEN2 = "p1000_single_gen2"
    P300_SINGLE_GEN3 = "p300_single_gen3"
    P1000_SINGLE_GEN3 = "p1000_single_gen3"


class LoadedPipette(BaseModel):
    """A pipette that has been loaded."""

    id: str
    pipetteName: PipetteName
    mount: MountType


class MovementAxis(str, Enum):
    """Axis on which to issue a relative movement."""

    X = "x"
    Y = "y"
    Z = "z"


class MotorAxis(str, Enum):
    """Motor axis on which to issue a home command."""

    X = "x"
    Y = "y"
    LEFT_Z = "leftZ"
    RIGHT_Z = "rightZ"
    LEFT_PLUNGER = "leftPlunger"
    RIGHT_PLUNGER = "rightPlunger"


# TODO(mc, 2022-01-18): use opentrons_shared_data.module.dev_types.ModuleModel
class ModuleModel(str, Enum):
    """All available modules' models."""

    TEMPERATURE_MODULE_V1 = "temperatureModuleV1"
    TEMPERATURE_MODULE_V2 = "temperatureModuleV2"
    MAGNETIC_MODULE_V1 = "magneticModuleV1"
    MAGNETIC_MODULE_V2 = "magneticModuleV2"
    THERMOCYCLER_MODULE_V1 = "thermocyclerModuleV1"
    THERMOCYCLER_MODULE_V2 = "thermocyclerModuleV2"
    HEATER_SHAKER_MODULE_V1 = "heaterShakerModuleV1"

    def as_type(self) -> ModuleType:
        """Get the ModuleType of this model."""
        if ModuleModel.is_temperature_module_model(self):
            return ModuleType.TEMPERATURE
        elif ModuleModel.is_magnetic_module_model(self):
            return ModuleType.MAGNETIC
        elif ModuleModel.is_thermocycler_module_model(self):
            return ModuleType.THERMOCYCLER
        elif ModuleModel.is_heater_shaker_module_model(self):
            return ModuleType.HEATER_SHAKER

        assert False, f"Invalid ModuleModel {self}"

    @classmethod
    def is_temperature_module_model(
        cls, model: ModuleModel
    ) -> TypeGuard[TemperatureModuleModel]:
        """Whether a given model is a Temperature Module."""
        return model in [cls.TEMPERATURE_MODULE_V1, cls.TEMPERATURE_MODULE_V2]

    @classmethod
    def is_magnetic_module_model(
        cls, model: ModuleModel
    ) -> TypeGuard[MagneticModuleModel]:
        """Whether a given model is a Magnetic Module."""
        return model in [cls.MAGNETIC_MODULE_V1, cls.MAGNETIC_MODULE_V2]

    @classmethod
    def is_thermocycler_module_model(
        cls, model: ModuleModel
    ) -> TypeGuard[ThermocyclerModuleModel]:
        """Whether a given model is a Thermocyler Module."""
        return model in [cls.THERMOCYCLER_MODULE_V1, cls.THERMOCYCLER_MODULE_V2]

    @classmethod
    def is_heater_shaker_module_model(
        cls, model: ModuleModel
    ) -> TypeGuard[HeaterShakerModuleModel]:
        """Whether a given model is a Heater-Shaker Module."""
        return model == cls.HEATER_SHAKER_MODULE_V1


TemperatureModuleModel = Literal[
    ModuleModel.TEMPERATURE_MODULE_V1, ModuleModel.TEMPERATURE_MODULE_V2
]
MagneticModuleModel = Literal[
    ModuleModel.MAGNETIC_MODULE_V1, ModuleModel.MAGNETIC_MODULE_V2
]
ThermocyclerModuleModel = Literal[
    ModuleModel.THERMOCYCLER_MODULE_V1, ModuleModel.THERMOCYCLER_MODULE_V2
]
HeaterShakerModuleModel = Literal[ModuleModel.HEATER_SHAKER_MODULE_V1]


class ModuleDimensions(BaseModel):
    """Dimension type for modules."""

    bareOverallHeight: float
    overLabwareHeight: float
    lidHeight: Optional[float]


class ModuleCalibrationPoint(BaseModel):
    """Calibration Point type for module definition."""

    x: float
    y: float
    z: float


class LabwareOffsetVector(BaseModel):
    """Offset, in deck coordinates from nominal to actual position."""

    x: float
    y: float
    z: float


class ModuleDefinition(BaseModel):
    """Module definition class."""

    otSharedSchema: str = Field("module/schemas/2", description="The current schema.")
    moduleType: ModuleType = Field(
        ...,
        description="Module type (Temperature/Magnetic/Thermocycler)",
    )
    model: ModuleModel = Field(..., description="Model name of the module")
    labwareOffset: LabwareOffsetVector = Field(
        ...,
        description="Labware offset in x, y, z.",
    )
    dimensions: ModuleDimensions = Field(..., description="Module dimension")
    calibrationPoint: ModuleCalibrationPoint = Field(
        ...,
        description="Calibration point of module.",
    )
    displayName: str = Field(..., description="Display name.")
    quirks: List[str] = Field(..., description="Module quirks")
    slotTransforms: Dict[str, Any] = Field(
        ...,
        description="Dictionary of transforms for each slot.",
    )
    compatibleWith: List[ModuleModel] = Field(
        ...,
        description="List of module models this model is compatible with.",
    )


class LoadedModule(BaseModel):
    """A module that has been loaded."""

    id: str
    model: ModuleModel
    location: Optional[DeckSlotLocation]
    serialNumber: str


class LabwareOffsetLocation(BaseModel):
    """Parameters describing when a given offset may apply to a given labware load."""

    slotName: DeckSlotName = Field(
        ...,
        description=(
            "The deck slot where the protocol will load the labware."
            " Or, if the protocol will load the labware on a module,"
            " the deck slot where the protocol will load that module."
        ),
    )
    moduleModel: Optional[ModuleModel] = Field(
        None,
        description=(
            "The model of the module that the labware will be loaded onto,"
            " if applicable."
            "\n\n"
            "Because of module compatibility, the model that the protocol requests"
            " may not be exactly the same"
            " as what it will find physically connected during execution."
            " For this labware offset to apply,"
            " this field must be the *requested* model, not the connected one."
            " You can retrieve this from a `loadModule` command's `params.model`"
            " in the protocol's analysis."
        ),
    )


class LabwareOffset(BaseModel):
    """An offset that the robot adds to a pipette's position when it moves to a labware.

    During the run, if a labware is loaded whose definition URI and location
    both match what's found here, the given offset will be added to all
    pipette movements that use that labware as a reference point.
    """

    id: str = Field(..., description="Unique labware offset record identifier.")
    createdAt: datetime = Field(..., description="When this labware offset was added.")
    definitionUri: str = Field(..., description="The URI for the labware's definition.")
    location: LabwareOffsetLocation = Field(
        ...,
        description="Where the labware is located on the robot.",
    )
    vector: LabwareOffsetVector = Field(
        ...,
        description="The offset applied to matching labware.",
    )


class LabwareOffsetCreate(BaseModel):
    """Create request data for a labware offset."""

    definitionUri: str = Field(..., description="The URI for the labware's definition.")
    location: LabwareOffsetLocation = Field(
        ...,
        description="Where the labware is located on the robot.",
    )
    vector: LabwareOffsetVector = Field(
        ...,
        description="The offset applied to matching labware.",
    )


class LoadedLabware(BaseModel):
    """A labware that has been loaded."""

    id: str
    loadName: str
    definitionUri: str
    location: LabwareLocation
    offsetId: Optional[str] = Field(
        None,
        description=(
            "An ID referencing the offset applied to this labware placement,"
            " decided at load time."
            " Null or undefined means no offset was provided for this load,"
            " so the default of (0, 0, 0) will be used."
        ),
    )


class SpeedRange(NamedTuple):
    """Minimum and maximum allowed speeds for a shaking module."""

    min: int
    max: int


class TemperatureRange(NamedTuple):
    """Minimum and maximum allowed temperatures for a heating module."""

    min: float
    max: float


@dataclass(frozen=True)
class HeaterShakerMovementRestrictors:
    """Shaking status, latch status and slot location for determining movement restrictions."""

    plate_shaking: bool
    latch_closed: bool
    deck_slot: int
