import typing
from typing_extensions import Literal, Final
from datetime import datetime

from opentrons.config.robot_configs import (
    default_pipette_offset,
    default_gripper_calibration_offset,
)
from opentrons.types import Point, Mount

# TODO change this when imports are fixed
from opentrons.calibration_storage.ot3.pipette_offset import (
    save_pipette_calibration,
    get_pipette_offset,
)
from opentrons.calibration_storage import (
    types as cal_top_types,
    gripper_offset,
)
from opentrons.hardware_control.types import OT3Mount

PIPETTE_OFFSET_CONSISTENCY_LIMIT: Final = 1.5


class CalibrationDataProvider(Generic[MountType]) -> None:
    def __init__(self) -> None:
        ...

    def check_instrument_offset_reasonability(
        left_offset: Point, right_offset: Point
    ) -> typing.List[ReasonabilityCheckFailure]:
        if (
            not left_offset
            or left_offset == Point(0, 0, 0)
            or not right_offset
            or right_offset == Point(0, 0, 0)
        ):
            return []
        diff = left_offset - right_offset
        if any(abs(d) > PIPETTE_OFFSET_CONSISTENCY_LIMIT for d in diff):
            return [
                InconsistentPipetteOffsets(
                    "inconsistent-pipette-offset",
                    {Mount.LEFT: left_offset, Mount.RIGHT: right_offset},
                    PIPETTE_OFFSET_CONSISTENCY_LIMIT,
                )
            ]
        return []


class PipetteCalibrationDataProvider() -> None:
    def __init__(self) -> None:
        ...

    @overload
    def save_pipette_offset_calibration(
        pip_id: typing.Optional[str], mount: Mount, offset: Point
    ) -> None:
        ...

    @overload
    def save_pipette_offset_calibration(
        pip_id: typing.Optional[str], mount: OT3Mount, offset: Point
    ) -> None:
        ...

    def save_pipette_offset_calibration(
        pip_id, mount, offset
    ) -> None:
        # TODO this can be removed once we switch to using
        # ot3 pipette types in the ot3 hardware controller.
        if isinstance(mount, OT3Mount):
            checked_mount = mount.to_mount()
        else:
            checked_mount = mount
        if pip_id:
            save_pipette_calibration(offset, pip_id, checked_mount)

    @overload
    def load_pipette_offset(
        pip_id: typing.Optional[str], mount: Mount
    ) -> PipetteOffsetByPipetteMount:
        ...

    @overload
    def load_pipette_offset(
        pip_id: typing.Optional[str], mount: OT3Mount
    ) -> PipetteOffsetByPipetteMount:
        ...

    @overload
    def load_pipette_offset(
        pip_id, mount
    ) -> PipetteOffsetByPipetteMount:
        # load default if pipette offset data do not exist
        pip_cal_obj = PipetteOffsetByPipetteMount(
            offset=Point(*default_pipette_offset()),
            source=cal_top_types.SourceType.default,
            status=cal_top_types.CalibrationStatus(),
        )
        # TODO this can be removed once we switch to using
        # ot3 pipette types in the ot3 hardware controller.
        if isinstance(mount, OT3Mount):
            checked_mount = mount.to_mount()
        else:
            checked_mount = mount
        if pip_id:
            pip_offset_data = get_pipette_offset(pip_id, checked_mount)
            if pip_offset_data:
                return PipetteOffsetByPipetteMount(
                    offset=pip_offset_data.offset,
                    last_modified=pip_offset_data.lastModified,
                    source=pip_offset_data.source,
                    status=cal_top_types.CalibrationStatus(
                        markedAt=pip_offset_data.status.markedAt,
                        markedBad=pip_offset_data.status.markedBad,
                        source=pip_offset_data.status.source,
                    ),
                )
        return pip_cal_obj


class OT2PipetteCalibrationDataProvider(PipetteCalibrationDataProvider) -> None:
    def __init__(self) -> None:
        ...


    # TODO (lc 09-26-2022) We should ensure that only LabwareDefinition models are passed
    # into this function instead of a mixture of TypeDicts and BaseModels
    def load_tip_length_for_pipette(
        pipette_id: str, tiprack: typing.Union["TypeDictLabwareDef", LabwareDefinition]
    ) -> TipLengthCalibration:
        if isinstance(tiprack, LabwareDefinition):
            tiprack = typing.cast(
                "TypeDictLabwareDef", tiprack.dict(exclude_none=True, exclude_unset=True)
            )

        tip_length_data = calibration_storage.load_tip_length_calibration(
            pipette_id, tiprack
        )

        # TODO (lc 09-26-2022) We shouldn't have to do a hash twice. We should figure out what
        # information we actually need from the labware definition and pass it into
        # the `load_tip_length_calibration` function.
        tiprack_hash = helpers.hash_labware_def(tiprack)

        return TipLengthCalibration(
            tip_length=tip_length_data.tipLength,
            source=tip_length_data.source,
            pipette=pipette_id,
            tiprack=tiprack_hash,
            last_modified=tip_length_data.lastModified,
            uri=tip_length_data.uri,
            status=types.CalibrationStatus(
                markedAt=tip_length_data.status.markedAt,
                markedBad=tip_length_data.status.markedBad,
                source=tip_length_data.status.source,
            ),
        )
    




class GripperCalibrationDataProvider():
    def __init__(self) -> None:
        ...
    
    def load_gripper_calibration_offset(
        gripper_id: typing.Optional[str],
    ) -> GripperCalibrationOffset:
        # load default if gripper offset data do not exist
        grip_cal_obj = GripperCalibrationOffset(
            offset=Point(*default_gripper_calibration_offset()),
            source=cal_top_types.SourceType.default,
            status=cal_top_types.CalibrationStatus(),
        )
        if gripper_id:
            grip_offset_data = gripper_offset.get_gripper_calibration_offset(gripper_id)
            if grip_offset_data:
                return GripperCalibrationOffset(
                    offset=grip_offset_data.offset,
                    last_modified=grip_offset_data.lastModified,
                    source=grip_offset_data.source,
                    status=cal_top_types.CalibrationStatus(
                        markedAt=grip_offset_data.status.markedAt,
                        markedBad=grip_offset_data.status.markedBad,
                        source=grip_offset_data.status.source,
                    ),
                )
        return grip_cal_obj


    def save_gripper_calibration_offset(
        gripper_id: typing.Optional[str], delta: Point
    ) -> None:
        if gripper_id:
            gripper_offset.save_gripper_calibration(delta, gripper_id)

