"""Flex-specific extensions to instrument configuration."""
from typing import Union, Optional
from typing_extensions import Protocol

from .types import MountArgType

from opentrons.hardware_control.dev_types import (
    PipetteStateDict,
)
from opentrons.hardware_control.types import (
    TipStateType,
    InstrumentProbeType,
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

    async def get_tip_presence_status(
        self,
        mount: MountArgType,
    ) -> TipStateType:
        """Check tip presence status.

        If a high throughput pipette is present,
        move the tip motors down before checking the sensor status.
        """
        ...

    async def verify_tip_presence(
        self,
        mount: MountArgType,
        expected: TipStateType,
        follow_singular_sensor: Optional[InstrumentProbeType] = None,
    ) -> None:
        """Check tip presence status and raise if it does not match `expected`."""
        ...
