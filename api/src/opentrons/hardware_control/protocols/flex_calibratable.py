from typing import Optional, Tuple, List, AsyncIterator, Union
import contextlib
from typing_extensions import Protocol

from opentrons import types as top_types
from opentrons.config.types import (
    CapacitivePassSettings,
)
from opentrons.hardware_control.types import (
    Axis,
    OT3Mount,
    InstrumentProbeType,
    GripperProbe,
)
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    GripperCalibrationOffset,
    PipetteOffsetSummary,
)
from opentrons.hardware_control.modules.module_calibration import (
    ModuleCalibrationOffset,
)


class FlexCalibratable(Protocol):
    """Calibration extensions for Flex hardware."""

    async def capacitive_probe(
        self,
        mount: OT3Mount,
        moving_axis: Axis,
        target_pos: float,
        pass_settings: CapacitivePassSettings,
        retract_after: bool = True,
        probe: Optional[InstrumentProbeType] = None,
    ) -> Tuple[float, bool]:
        """Determine the position of something using the capacitive sensor.

        This function orchestrates detecting the position of a collision between the
        capacitive probe on the tool on the specified mount, and some fixed element
        of the robot.

        When calling this function, the mount's probe critical point should already
        be aligned in the probe axis with the item to be probed.

        It will move the mount's probe critical point to a small distance behind
        the expected position of the element (which is target_pos, in deck coordinates,
        in the axis to be probed) while running the tool's capacitive sensor. When the
        sensor senses contact, the mount stops.

        This function moves away and returns the sensed position.

        This sensed position can be used in several ways, including
        - To get an absolute position in deck coordinates of whatever was
        targeted, if something was guaranteed to be physically present.
        - To detect whether a collision occured at all. If this function
        returns a value far enough past the anticipated position, then it indicates
        there was no material there.
        """
        ...

    async def capacitive_sweep(
        self,
        mount: OT3Mount,
        moving_axis: Axis,
        begin: top_types.Point,
        end: top_types.Point,
        speed_mm_s: float,
    ) -> List[float]:
        ...

    # Note that there is a default implementation of this function to allow for
    # the asynccontextmanager decorator to propagate properly.
    @contextlib.asynccontextmanager
    async def restore_system_constrants(self) -> AsyncIterator[None]:
        yield

    async def set_system_constraints_for_calibration(self) -> None:
        ...

    async def reset_instrument_offset(
        self, mount: Union[top_types.Mount, OT3Mount], to_default: bool = True
    ) -> None:
        ...

    def add_gripper_probe(self, probe: GripperProbe) -> None:
        ...

    def remove_gripper_probe(self) -> None:
        ...

    async def save_instrument_offset(
        self, mount: Union[top_types.Mount, OT3Mount], delta: top_types.Point
    ) -> Union[GripperCalibrationOffset, PipetteOffsetSummary]:
        ...

    async def save_module_offset(
        self, module_id: str, mount: OT3Mount, slot: str, offset: top_types.Point
    ) -> Optional[ModuleCalibrationOffset]:
        ...
