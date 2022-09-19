import typing
from typing_extensions import Literal
from dataclasses import dataclass
from datetime import datetime
from opentrons.config.robot_configs import default_pipette_offset

from opentrons.types import Mount
from opentrons.calibration_storage import types
from opentrons.calibration_storage.ot2 import get
from opentrons.hardware_control.types import OT3Mount

from opentrons_shared_data.pipette.dev_types import LabwareUri


@dataclass
class PipetteOffsetByPipetteMount:
    """
    Class to store pipette offset without pipette and mount info
    """

    offset: types.InstrumentCalOffset
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
    offset: types.InstrumentCalOffset
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
    uri: typing.Union[LabwareUri, Literal[""]]


def load_pipette_offset(
    pip_id: typing.Optional[str], mount: typing.Union[Mount, OT3Mount]
) -> PipetteOffsetByPipetteMount:
    # load default if pipette offset data do not exist
    pip_cal_obj = PipetteOffsetByPipetteMount(
        offset=default_pipette_offset(),
        source=types.SourceType.default,
        status=types.CalibrationStatus(),
    )
    # TODO this can be removed once we switch to using
    # ot3 pipette types in the ot3 hardware controller.
    if isinstance(mount, OT3Mount):
        checked_mount = mount.to_mount()
    else:
        checked_mount = mount
    if pip_id:
        pip_offset_data = get.get_pipette_offset(pip_id, checked_mount)
        if pip_offset_data:
            return PipetteOffsetByPipetteMount(**pip_offset_data.dict())
    return pip_cal_obj


def load_tip_length_for_pipette(pipette_id: str, tiprack: LabwareUri) -> TipLengthCalibration:
    try:
        tip_length_data = get.load_tip_length_calibration(pipette_id, tiprack)
        return TipLengthCalibration(**tip_length_data.dict())
    except types.TipLengthCalNotFound:
        raise types.TipLengthCalNotFound()
