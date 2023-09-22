from typing import Dict, List, Optional, Any, Sequence
from typing_extensions import Final
from dataclasses import dataclass
from collections import OrderedDict
from enum import Enum

from opentrons.hardware_control.types import CriticalPoint
from opentrons.types import Point
from opentrons_shared_data.errors import (
    ErrorCodes,
    EnumeratedError,
)


class NozzleConfigurationType(Enum):
    """
    Nozzle Configuration Type.

    Represents
    """

    COLUMN = "COLUMN"
    ROW = "ROW"
    QUADRANT = "QUADRANT"
    SINGLE = "SINGLE"
    FULL = "FULL"


@dataclass
class CurrentNozzleConfiguration:
    back_left_nozzle: str
    front_right_nozzle: str
    configuration: NozzleConfigurationType

    def __str__(self) -> str:
        return f"back_left_nozzle: {self.back_left_nozzle} front_right_nozzle: {self.front_right_nozzle} configuration: {self.configuration}"


class IncompatibleNozzleConfiguration(EnumeratedError):
    """Error raised if nozzle configuration is incompatible with the currently loaded pipette."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a IncompatibleNozzleConfiguration error."""
        super().__init__(
            code=ErrorCodes.API_MISCONFIGURATION,
            message=message,
            detail=detail,
            wrapping=wrapping,
        )


class NozzleConfigurationManager:
    def __init__(
        self,
        nozzle_map: Dict[str, List[float]],
        nozzle_configuration: CurrentNozzleConfiguration,
        current_scalar: float,
    ) -> None:
        sorted_nozzlemap = list(nozzle_map.keys())
        sorted_nozzlemap.sort(key=lambda x: int(x[1::]))
        self._nozzle_map: Dict[str, Point] = OrderedDict(
            {k: Point(*nozzle_map[k]) for k in sorted_nozzlemap}
        )
        self._first_nozzle = next(iter(self._nozzle_map.values()))
        self._last_nozzle = next(reversed(self._nozzle_map.values()))

        self._current_nozzle_configuration = nozzle_configuration

        self._xy_nozzle: Final[Point] = self._get_nozzle_for(CriticalPoint.XY_CENTER)
        self._front_nozzle: Final[Point] = self._get_nozzle_for(
            CriticalPoint.FRONT_NOZZLE
        )
        self._current_scalar: Final[float] = current_scalar

    def _get_nozzle_for(self, critical_point: CriticalPoint) -> Point:
        if critical_point == CriticalPoint.XY_CENTER:
            difference = self._last_nozzle - self._first_nozzle
            return self._first_nozzle + Point(difference[0] / 2, difference[1] / 2, 0)
        elif (
            critical_point == CriticalPoint.FRONT_NOZZLE
            and self._first_nozzle != self._last_nozzle
        ):
            # front left nozzle of the 96 channel and
            # front nozzle of the 8 channel
            return self._nozzle_map["H1"]
        return self._first_nozzle

    def _determine_nozzle_configuration(
        self, back_left_nozzle: str, front_right_nozzle: str
    ) -> NozzleConfigurationType:
        nozzle_difference = (
            self._nozzle_map[back_left_nozzle] - self._nozzle_map[front_right_nozzle]
        )
        if nozzle_difference == Point(0, 0, 0):
            return NozzleConfigurationType.SINGLE
        elif nozzle_difference[0] == 0:
            return NozzleConfigurationType.COLUMN
        elif nozzle_difference[1] == 0:
            return NozzleConfigurationType.ROW
        else:
            return NozzleConfigurationType.QUADRANT

    @classmethod
    def build_from_nozzlemap(
        cls, nozzle_map: Dict[str, List[float]], current_scalar: float
    ) -> "NozzleConfigurationManager":
        starting_nozzle_config = CurrentNozzleConfiguration(
            back_left_nozzle="A1",
            # TODO gotta fix this to be a real nozzle
            front_right_nozzle="H1",
            configuration=NozzleConfigurationType.FULL,
        )
        return cls(nozzle_map, starting_nozzle_config, current_scalar)

    @property
    def nozzle_offset(self) -> Point:
        return self._nozzle_map[self._current_nozzle_configuration.back_left_nozzle]

    def update_nozzle_with_tips(
        self, back_left_nozzle: str, front_right_nozzle: str
    ) -> None:
        if back_left_nozzle > front_right_nozzle:
            raise IncompatibleNozzleConfiguration(
                message=f"Starting nozzle {back_left_nozzle} must not be greater than the ending nozzle {front_right_nozzle}.",
                detail={
                    "current_nozzle_configuration": self._current_nozzle_configuration,
                    "requested_back_left_nozzle": back_left_nozzle,
                    "requested_front_right_nozzle": front_right_nozzle,
                },
            )
        if not self._nozzle_map.get(back_left_nozzle):
            raise IncompatibleNozzleConfiguration(
                message=f"Starting nozzle {back_left_nozzle} does not exist in the nozzle map.",
                detail={
                    "current_nozzle_configuration": self._current_nozzle_configuration,
                    "requested_back_left_nozzle": back_left_nozzle,
                    "requested_front_right_nozzle": front_right_nozzle,
                },
            )

        if not self._nozzle_map.get(front_right_nozzle):
            raise IncompatibleNozzleConfiguration(
                message=f"Ending nozzle {front_right_nozzle} does not exist in the nozzle map.",
                detail={
                    "current_nozzle_configuration": self._current_nozzle_configuration,
                    "requested_back_left_nozzle": back_left_nozzle,
                    "requested_front_right_nozzle": front_right_nozzle,
                },
            )

        # determine nozzle configuration based on the difference

        self._current_nozzle_configuration = CurrentNozzleConfiguration(
            back_left_nozzle=back_left_nozzle,
            front_right_nozzle=front_right_nozzle,
            configuration=self._determine_nozzle_configuration(
                back_left_nozzle, front_right_nozzle
            ),
        )

    def update_nozzle_with_critical_point(
        self, cp_override: Optional[CriticalPoint]
    ) -> Point:
        if cp_override == CriticalPoint.XY_CENTER:
            return self._xy_nozzle
        elif cp_override == CriticalPoint.FRONT_NOZZLE:
            return self._front_nozzle
        else:
            return self.nozzle_offset

    def get_current_for_tip_configuration(self) -> float:
        # TODO While implementing this PR I realized that
        # the current scalar truly is inefficient for
        # encapsulating varying currents needed for
        # pick up tip so we'll need to follow this up
        # with a lookup table.
        return self._current_scalar

    def critical_point_with_tip_length(
        self,
        cp_override: Optional[CriticalPoint],
        tip_length: float = 0.0,
    ) -> Point:
        current_nozzle = self.update_nozzle_with_critical_point(cp_override)
        return current_nozzle - Point(0, 0, tip_length)
