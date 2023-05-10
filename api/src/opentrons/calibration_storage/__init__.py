from opentrons import config

from typing import Union
from . import flex_models, ot2_models


## TODO maybe use semver?

DeckCalibrationType = Union[
    ot2_models.v1.DeckCalibrationModel,
    flex_models.v1.DeckCalibrationModel,
]


PipetteCalibrationType = Union[
    ot2_models.v1.InstrumentOffsetModel,
    flex_models.v1.InstrumentOffsetModel,
]


TipLengthCalibrationType = Union[
    ot2_models.v1.TipLengthModel,
    flex_models.v1.TipLengthModel,
]

CalibrationStatusType = Union[
    ot2_models.v1.CalibrationStatus,
    flex_models.v1.CalibrationStatus,
]

__all__ = []
