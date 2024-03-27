from dataclasses import dataclass, field
from opentrons.calibration_storage import types

@dataclass
class PipetteOffsetByPipetteMount:
    """
    Class to store pipette offset without pipette and mount info
    """

    offset: Point
    source: types.SourceType
    status: types.CalibrationStatus
    tiprack: typing.Optional[str] = None
    uri: typing.Optional[str] = None
    last_modified: typing.Optional[datetime] = None


@dataclass
class PipetteOffsetCalibration:
    """
    Class to store pipette offset calibration with pipette and mount info
    """

    pipette: str
    mount: str
    offset: Point
    tiprack: str
    uri: str
    last_modified: datetime
    source: types.SourceType
    status: types.CalibrationStatus


@dataclass
class TipLengthCalibration:
    tip_length: float
    source: types.SourceType
    status: types.CalibrationStatus
    pipette: str
    tiprack: str
    last_modified: datetime
    uri: typing.Union["LabwareUri", Literal[""]]

@dataclass
class InconsistentPipetteOffsets:
    kind: Literal["inconsistent-pipette-offset"]
    offsets: typing.Dict[Mount, Point]
    limit: float


ReasonabilityCheckFailure = typing.Union[InconsistentPipetteOffsets]


@dataclass
class PipetteOffsetByPipetteMount:
    """
    Class to store pipette offset without pipette and mount info
    """

    offset: Point
    source: cal_top_types.SourceType
    status: cal_top_types.CalibrationStatus
    last_modified: typing.Optional[datetime] = None


@dataclass
class PipetteOffsetSummary(PipetteOffsetByPipetteMount):
    reasonability_check_failures: typing.List[ReasonabilityCheckFailure] = field(
        default_factory=list
    )


@dataclass
class GripperCalibrationOffset:
    """
    Class to store gripper offset calibration with gripper info

    TODO(lc 09/15/2022) this can probably be combined with
    pipette offset mount.
    """

    offset: Point
    source: cal_top_types.SourceType
    status: cal_top_types.CalibrationStatus
    last_modified: typing.Optional[datetime] = None