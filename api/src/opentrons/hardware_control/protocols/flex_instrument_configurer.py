"""Flex-specific extensions to instrument configuration."""
from typing import Union
from typing_extensions import Protocol

from .types import MountArgType

from opentrons.hardware_control.dev_types import (
    PipetteStateDict,
)
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    PipetteOffsetSummary,
    GripperCalibrationOffset,
)


class FlexInstrumentConfigurer(Protocol[MountArgType]):
    """A protocol specifying Flex-specific extensions to instrument configuration."""

    async def get_instrument_state(
        self,
        mount: MountArgType,
    ) -> PipetteStateDict:
        ...

    def get_instrument_offset(
        self, mount: MountArgType
    ) -> Union[GripperCalibrationOffset, PipetteOffsetSummary, None]:
        ...
