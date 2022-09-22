from opentrons.config import feature_flags
from .instrument_abc import AbstractInstrument
from .ot2.pipette import Pipette

if feature_flags.enable_ot3_hardware_controller():
    from .ot3.gripper import Gripper
    from .ot3 import instrument_calibration

    __all__ = ["AbstractInstrument", "Pipette", "Gripper", "instrument_calibration"]
else:
    from .ot2 import instrument_calibration

    __all__ = ["AbstractInstrument", "Pipette", "instrument_calibration"]
