from typing import Dict, List, Optional, Tuple
from typing_extensions import Final
from dataclasses import dataclass
from collections import OrderedDict

from opentrons.hardware_control.types import CriticalPoint
from opentrons.types import Point


@dataclass
class CurrentNozzleConfiguration:
    starting_nozzle: str
    number_of_nozzles: int
    starting_index: int
    ending_index: int


class IncompatibleNozzleConfiguration(Exception):
    """Error raised if nozzle configuration is incompatible with the currently loaded pipette."""

    def __init__(
        self, custom_error: str, starting_nozzle: str, number_of_nozzles: int
    ) -> None:
        """Initialize IncompatibleNozzleConfiguration error."""
        super().__init__(
            f"Failed to update the NozzleManager using {starting_nozzle} "
            f"with {number_of_nozzles} tips. {custom_error}."
        )


INTERNOZZLE_SPACING_MM: Final[float] = 9
MAXIMUM_ALLOWED_ROWS: Final[float] = 8
MAXIMUM_ALLOWED_COLUMNS: Final[float] = 12


class NozzleConfigurationManager:
    def __init__(
        self,
        nozzle_map: Dict[str, List[float]],
        nozzle_configuration: CurrentNozzleConfiguration,
        current_scalar: float,
    ) -> None:
        nozzle_map_ordered_dict = OrderedDict(nozzle_map)
        self._nozzle_map: List[Tuple(str, List[float])] = list(
            nozzle_map_ordered_dict.items()
        )
        self._nozzle_map_key_lookup = list(nozzle_map_ordered_dict.keys())
        self._current_nozzle_configuration = nozzle_configuration

        self._xy_nozzle: Final[str] = self._get_nozzle_index_for(
            CriticalPoint.XY_CENTER
        )
        self._front_nozzle: Final[str] = self._get_nozzle_index_for(
            CriticalPoint.FRONT_NOZZLE
        )
        self._current_scalar: Final[float] = current_scalar

    def _get_nozzle_index_for(self, critical_point: CriticalPoint) -> int:
        max_num_tips = len(self._nozzle_map) - 1
        if critical_point == CriticalPoint.XY_CENTER:
            index = max_num_tips // 2 - max_num_tips // MAXIMUM_ALLOWED_COLUMNS
        elif critical_point == CriticalPoint.FRONT_NOZZLE and max_num_tips > 1:
            # front left nozzle of the 96 channel and
            # front nozzle of the 8 channel
            index = MAXIMUM_ALLOWED_ROWS - 1
        else:
            index = 0
        return index

    @classmethod
    def build_from_nozzlemap(
        cls, nozzle_map: Dict[str, List[float]], current_scalar: float
    ) -> "NozzleConfigurationManager":
        starting_nozzle_config = CurrentNozzleConfiguration(
            starting_nozzle="A1",
            number_of_nozzles=len(nozzle_map),
            starting_index=0,
            ending_index=len(nozzle_map) - 1,
        )
        return cls(nozzle_map, starting_nozzle_config, current_scalar)

    @property
    def nozzle_offset(self) -> List[float]:
        return self._nozzle_map[self._current_nozzle_configuration.starting_index][1]

    def update_nozzle_with_tips(
        self, starting_nozzle: str, number_of_nozzles: int
    ) -> None:
        starting_index = self._nozzle_map_key_lookup.index(starting_nozzle)
        ending_index = starting_index + number_of_nozzles
        if number_of_nozzles > len(self._nozzle_map):
            raise IncompatibleNozzleConfiguration(
                f"The number of tips {number_of_nozzles} exceeded the max of {len(self._nozzle_map)}",
                starting_nozzle,
                number_of_nozzles,
            )
        try:
            self._nozzle_map[starting_index]
            self._nozzle_map[ending_index]
        except ValueError as e:
            raise IncompatibleNozzleConfiguration(
                f"{type(e)}: {e}", starting_nozzle, number_of_nozzles
            )

        self._current_nozzle_configuration = CurrentNozzleConfiguration(
            starting_nozzle=starting_nozzle,
            number_of_nozzles=number_of_nozzles,
            starting_index=starting_index,
            ending_index=ending_index,
        )

    def update_nozzle_with_critical_point(
        self, cp_override: Optional[CriticalPoint]
    ) -> List[float]:
        if cp_override == CriticalPoint.XY_CENTER:
            return self._nozzle_map[self._xy_nozzle][1]
        elif cp_override == CriticalPoint.FRONT_NOZZLE:
            return self._nozzle_map[self._front_nozzle][1]
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
        cp_for_nozzle_with_tip = Point(
            current_nozzle[0], current_nozzle[1], current_nozzle[2] - tip_length
        )
        return cp_for_nozzle_with_tip
