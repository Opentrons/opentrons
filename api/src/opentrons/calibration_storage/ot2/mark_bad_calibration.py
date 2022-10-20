import typing

from opentrons.util.helpers import utc_now

from .. import types as local_types

from .models import v1


@typing.overload
def mark_bad(
    calibration: v1.DeckCalibrationModel, source_marked_bad: local_types.SourceType
) -> v1.DeckCalibrationModel:
    ...


@typing.overload
def mark_bad(
    calibration: v1.PipetteOffsetCalibration,
    source_marked_bad: local_types.SourceType,
) -> v1.PipetteOffsetCalibration:
    ...


@typing.overload
def mark_bad(
    calibration: v1.TipLengthCalibration,
    source_marked_bad: local_types.SourceType,
) -> v1.TipLengthCalibration:
    ...


def mark_bad(
    calibration: typing.Union[
        v1.DeckCalibrationModel,
        v1.PipetteOffsetCalibration,
        v1.TipLengthCalibration,
    ],
    source_marked_bad: local_types.SourceType,
) -> typing.Union[
    v1.DeckCalibrationModel,
    v1.PipetteOffsetCalibration,
    v1.TipLengthCalibration,
]:
    calibration.status = v1.CalibrationStatus(
        markedBad=True, source=source_marked_bad, markedAt=utc_now()
    )
    return calibration
