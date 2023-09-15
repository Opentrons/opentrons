from typing import Dict, List, Optional
from typing_extensions import Final

from opentrons.hardware_control.types import CriticalPoint
from opentrons.types import Point


class UpdateTipTo:
    starting_nozzle: str
    number_of_tips: int

INTERNOZZLE_SPACING_MM: Final[float] = 9
MAXIMUM_ALLOWED_ROWS: Final[float] = 8
MAXIMUM_ALLOWED_COLUMNS: Final[float] = 12


class NozzleConfigurationManager:
    def __init__(
        self, nozzle_map: Dict[str, List[float]], nozzle_configuration: UpdateTipTo, current_scalar: float
    ) -> None:
        self._nozzle_map = nozzle_map
        self._current_nozzle_configuration = nozzle_configuration
        self._xy_nozzle: Final[str] = self._get_nozzle_name_for(CriticalPoint.XY_CENTER)
        self._front_nozzle: Final[str] = self._get_nozzle_name_for(CriticalPoint.FRONT_NOZZLE)
        self._current_scalar: Final[float] = current_scalar

    def _get_nozzle_name_for(self, critical_point: CriticalPoint) -> str:
        num_tips = self._current_nozzle_configuration.number_of_tips
        if critical_point == CriticalPoint.XY_CENTER:
            row = MAXIMUM_ALLOWED_ROWS // 2 % num_tips
            column = MAXIMUM_ALLOWED_COLUMNS % num_tips
        elif critical_point == CriticalPoint.FRONT_NOZZLE:
            row = MAXIMUM_ALLOWED_ROWS
            column = 1
        else:
            row = 0
            column = 1
        return f"{chr(ord('A') + row)}{column}"

    @classmethod
    def build_from_nozzlemap(cls, nozzle_map: Dict[str, List[float]], current_scalar: float) -> "NozzleConfigurationManager":
        starting_nozzle_config = UpdateTipTo(starting_nozzle="A1", number_of_tips=len(nozzle_map))
        return cls(nozzle_map, starting_nozzle_config, current_scalar)

    @property
    def nozzle_offset(self) -> List[float]:
        return self._nozzle_map[self._current_nozzle_configuration.starting_nozzle]

    def update_nozzle_with_tips(self, nozzle_config: UpdateTipTo) -> None:
        ending_tip = nozzle_config.starting_nozzle
        if nozzle_config.number_of_tips > len(self._nozzle_map):
            raise
        if not self._nozzle_map.get(
            nozzle_config.starting_nozzle
        ) or not self._nozzle_map.get(ending_tip):
            raise
        self._starting_nozzle = self._nozzle_map[nozzle_config.starting_nozzle]

    def update_nozzle_with_critical_point(
        self, cp_override: Optional[CriticalPoint]
    ) -> List[float]:
        if cp_override == CriticalPoint.XY_CENTER:
            return self._nozzle_map[self._xy_nozzle]
        elif cp_override == CriticalPoint.FRONT_NOZZLE:
            return self._nozzle_map[self._front_nozzle]
        else:
            return self.nozzle_offset
        
    def get_current_for_tip_configuration(self) -> float:
        return self._current_scalar * self._current_nozzle_configuration.number_of_tips

    def critical_point_for_tip_length(
        self,
        cp_override: Optional[CriticalPoint],
        tip_length: float = 0.0,
    ) -> Point:
        current_nozzle = self.update_nozzle_with_critical_point(cp_override)
        cp_for_nozzle = Point(
            current_nozzle[0], current_nozzle[1], current_nozzle[2] - tip_length
        )
        return cp_for_nozzle
