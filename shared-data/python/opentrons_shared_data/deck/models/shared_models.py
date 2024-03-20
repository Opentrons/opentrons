from typing import List, Literal, Dict, Tuple, Optional, Union, Any, TYPE_CHECKING
from pydantic import BaseModel, conint, confloat, validator


from opentrons_shared_data.module.dev_types import ModuleType
from ..dev_types import RobotModel


if TYPE_CHECKING:
    _StrictNonNegativeInt = int
    _StrictNonNegativeFloat = float
else:
    _StrictNonNegativeInt = conint(strict=True, ge=0)
    _StrictNonNegativeFloat = confloat(strict=True, ge=0.0)

UnitVectorVal = Literal[1, -1]
UnitVector = Tuple[UnitVectorVal, UnitVectorVal, UnitVectorVal]

Position = Tuple[float, float, float]


class Metadata(BaseModel):
    displayName: str
    tags: List[str]


class Robot(BaseModel):
    model: RobotModel


class BoundingBox(BaseModel):
    xDimension: _StrictNonNegativeFloat
    yDimension: _StrictNonNegativeFloat
    zDimension: _StrictNonNegativeFloat


class BasicInfoModel(BaseModel):
    id: str
    displayName: str


class CalibrationPoint(BasicInfoModel):
    position: Position


class FixedLabwareBySlot(BasicInfoModel):
    labware: str
    slot: str


class FixedLabwareByPosition(BasicInfoModel):
    labware: str
    position: Position


class FixedVolumeBySlot(BasicInfoModel):
    boundingBox: BoundingBox
    slot: str


class FixedVolumeByPosition(BasicInfoModel):
    boundingBox: BoundingBox
    position: Position


LegacyFixture = Union[
    FixedLabwareBySlot, FixedLabwareByPosition, FixedVolumeBySlot, FixedVolumeByPosition
]

CompatibleModules = List[ModuleType]


class AxisOffset(BaseModel):
    x: float
    y: float
    z: float


class GripperOffsets(BaseModel):
    pickUpOffset: AxisOffset
    dropOffset: AxisOffset


class DeckDefinition(BaseModel):
    otId: str
    schemaVersion: Literal[3, 4, 5]
    cornerOffsetFromOrigin: Position
    dimensions: Position
    metadata: Metadata
    robot: Robot
    locations: Any
    gripperOffsets: Optional[Dict[str, GripperOffsets]]

    @validator("gripperOffsets", allow_reuse=True)
    def verify_gripper_offset(cls, v: GripperOffsets, values: Any) -> GripperOffsets:
        if "robot" in values and values["robot"].model == "OT-3 Standard" and not v:
            raise ValueError("passwords do not match")
        return v
